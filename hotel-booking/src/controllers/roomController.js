const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const crud = require('./crud');
const { asyncHandler, escapeRegex, parseDates } = require('../utils/helpers');

const base = crud(Room, { filterFields: ['hotel', 'type', 'status'], populate: 'hotel' });

// GET /api/rooms/available?checkIn=&checkOut=&city=&hotel=&guests=&type=&maxPrice=
const searchAvailable = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, city, hotel, guests, type, maxPrice } = req.query;
  const { inD, outD } = parseDates(checkIn, checkOut);

  // Осы кезеңде бос емес бөлмелер (күндер қиылысуы)
  const busyRooms = await Booking.find({
    status: { $in: ['pending', 'confirmed'] },
    checkIn: { $lt: outD },
    checkOut: { $gt: inD },
  }).distinct('room');

  const and = [{ _id: { $nin: busyRooms } }, { status: 'active' }];
  if (hotel) and.push({ hotel });
  if (city) {
    const ids = await Hotel.find({ city: new RegExp(escapeRegex(city), 'i') }).distinct('_id');
    and.push({ hotel: { $in: ids } });
  }
  if (type) and.push({ type });
  if (guests) and.push({ capacity: { $gte: Number(guests) } });
  if (maxPrice) and.push({ pricePerNight: { $lte: Number(maxPrice) } });

  const rooms = await Room.find({ $and: and }).populate('hotel').sort('pricePerNight');
  res.json({ success: true, count: rooms.length, data: rooms });
});

module.exports = { ...base, searchAvailable };
