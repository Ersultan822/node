const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const { asyncHandler, pickFilter, parseDates, countNights, HttpError } = require('../utils/helpers');

const POP = [
  { path: 'customer', select: 'fullName email phone' },
  { path: 'hotel', select: 'name city' },
  { path: 'room', select: 'number type pricePerNight' },
];

const isRoomFree = async (room, inD, outD, excludeId) => {
  const q = {
    room,
    status: { $in: ['pending', 'confirmed'] },
    checkIn: { $lt: outD },
    checkOut: { $gt: inD },
  };
  if (excludeId) q._id = { $ne: excludeId };
  return !(await Booking.exists(q));
};

const list = asyncHandler(async (req, res) => {
  const filter = pickFilter(req.query, ['customer', 'hotel', 'room', 'status', 'paymentStatus']);
  const items = await Booking.find(filter).populate(POP).sort('-createdAt');
  res.json({ success: true, count: items.length, data: items });
});

const get = asyncHandler(async (req, res) => {
  const item = await Booking.findById(req.params.id).populate(POP);
  if (!item) throw new HttpError(404, 'Бронь табылмады');
  res.json({ success: true, data: item });
});

// POST /api/bookings — бөлмені брондау
const create = asyncHandler(async (req, res) => {
  const { customer, room, checkIn, checkOut, guests = 1 } = req.body;
  const { inD, outD } = parseDates(checkIn, checkOut);

  if (!(await Customer.exists({ _id: customer }))) throw new HttpError(404, 'Клиент табылмады');
  const roomDoc = await Room.findById(room);
  if (!roomDoc) throw new HttpError(404, 'Бөлме табылмады');
  if (roomDoc.status !== 'active') throw new HttpError(409, 'Бөлме қазір қолжетімсіз (жөндеуде)');
  if (guests > roomDoc.capacity) throw new HttpError(400, `Бөлме сыйымдылығы: ${roomDoc.capacity}`);
  if (!(await isRoomFree(roomDoc._id, inD, outD))) throw new HttpError(409, 'Бөлме таңдалған күндерде бос емес');

  const nights = countNights(inD, outD);
  const booking = await Booking.create({
    customer,
    room: roomDoc._id,
    hotel: roomDoc.hotel,
    checkIn: inD,
    checkOut: outD,
    guests,
    nights,
    totalPrice: nights * roomDoc.pricePerNight,
  });
  res.status(201).json({ success: true, data: await booking.populate(POP) });
});

// PUT /api/bookings/:id — броньды өзгерту (күндер, қонақ саны, бөлме)
const update = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new HttpError(404, 'Бронь табылмады');
  if (['cancelled', 'completed'].includes(booking.status))
    throw new HttpError(409, `"${booking.status}" статусындағы броньды өзгертуге болмайды`);

  const checkIn = req.body.checkIn || booking.checkIn;
  const checkOut = req.body.checkOut || booking.checkOut;
  const guests = req.body.guests || booking.guests;
  const roomId = req.body.room || booking.room;
  const { inD, outD } = parseDates(checkIn, checkOut);

  const roomDoc = await Room.findById(roomId);
  if (!roomDoc) throw new HttpError(404, 'Бөлме табылмады');
  if (guests > roomDoc.capacity) throw new HttpError(400, `Бөлме сыйымдылығы: ${roomDoc.capacity}`);
  if (!(await isRoomFree(roomDoc._id, inD, outD, booking._id)))
    throw new HttpError(409, 'Бөлме таңдалған күндерде бос емес');

  booking.set({
    room: roomDoc._id,
    hotel: roomDoc.hotel,
    checkIn: inD,
    checkOut: outD,
    guests,
    nights: countNights(inD, outD),
  });
  booking.totalPrice = booking.nights * roomDoc.pricePerNight;
  await booking.save();
  res.json({ success: true, data: await booking.populate(POP) });
});

// PATCH /api/bookings/:id/cancel — броньнан бас тарту (жазба сақталады)
const cancel = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new HttpError(404, 'Бронь табылмады');
  if (booking.status === 'cancelled') throw new HttpError(409, 'Бронь бұрын бас тартылған');

  booking.status = 'cancelled';
  // Төленген болса — қайтарым статусы
  const paid = await Payment.findOne({ booking: booking._id, status: 'paid' });
  if (paid) {
    paid.status = 'refunded';
    await paid.save();
    booking.paymentStatus = 'refunded';
  }
  await booking.save();
  res.json({ success: true, data: await booking.populate(POP) });
});

// DELETE /api/bookings/:id — броньды толық жою
const remove = asyncHandler(async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) throw new HttpError(404, 'Бронь табылмады');
  await Payment.deleteMany({ booking: booking._id });
  res.json({ success: true, message: 'Бронь және оның төлемдері жойылды' });
});

module.exports = { list, get, create, update, cancel, remove };
