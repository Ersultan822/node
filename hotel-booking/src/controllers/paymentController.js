const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { asyncHandler, pickFilter, HttpError } = require('../utils/helpers');

const syncBooking = async (bookingId, status) => {
  const update = { paymentStatus: status };
  if (status === 'paid') update.status = 'confirmed'; // төленген бронь автоматты расталады
  await Booking.updateOne({ _id: bookingId, status: { $ne: 'cancelled' } }, update);
};

const list = asyncHandler(async (req, res) => {
  const items = await Payment.find(pickFilter(req.query, ['booking', 'status', 'method']))
    .populate({ path: 'booking', select: 'checkIn checkOut totalPrice status' })
    .sort('-createdAt');
  res.json({ success: true, count: items.length, data: items });
});

const get = asyncHandler(async (req, res) => {
  const item = await Payment.findById(req.params.id).populate('booking');
  if (!item) throw new HttpError(404, 'Төлем табылмады');
  res.json({ success: true, data: item });
});

// POST /api/payments { booking, method, amount? }
const create = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.booking);
  if (!booking) throw new HttpError(404, 'Бронь табылмады');
  if (booking.status === 'cancelled') throw new HttpError(409, 'Бас тартылған бронь үшін төлем жасалмайды');

  const status = req.body.status || 'pending';
  const payment = await Payment.create({
    booking: booking._id,
    amount: req.body.amount ?? booking.totalPrice,
    method: req.body.method,
    status,
    paidAt: status === 'paid' ? new Date() : undefined,
  });
  await syncBooking(booking._id, status);
  res.status(201).json({ success: true, data: payment });
});

// PATCH /api/payments/:id/status { status } — төлем статусын өзгерту
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'paid', 'failed', 'refunded'].includes(status))
    throw new HttpError(400, 'status: pending | paid | failed | refunded');
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new HttpError(404, 'Төлем табылмады');

  payment.status = status;
  payment.paidAt = status === 'paid' ? new Date() : payment.paidAt;
  await payment.save();
  await syncBooking(payment.booking, status);
  res.json({ success: true, data: payment });
});

const remove = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) throw new HttpError(404, 'Төлем табылмады');
  const last = await Payment.findOne({ booking: payment.booking }).sort('-createdAt');
  await Booking.updateOne({ _id: payment.booking }, { paymentStatus: last ? last.status : 'unpaid' });
  res.json({ success: true, message: 'Төлем жойылды' });
});

// GET /api/bookings/:id/payments
const byBooking = asyncHandler(async (req, res) => {
  const items = await Payment.find({ booking: req.params.id }).sort('-createdAt');
  res.json({ success: true, count: items.length, data: items });
});

module.exports = { list, get, create, updateStatus, remove, byBooking };
