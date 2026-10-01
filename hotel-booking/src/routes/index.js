const router = require('express').Router();
const Hotel = require('../models/Hotel');
const Customer = require('../models/Customer');
const crud = require('../controllers/crud');
const room = require('../controllers/roomController');
const booking = require('../controllers/bookingController');
const payment = require('../controllers/paymentController');

const mount = (path, c) => {
  router.route(path).get(c.list).post(c.create);
  router.route(`${path}/:id`).get(c.get).put(c.update).delete(c.remove);
};

// Hotels
mount('/hotels', crud(Hotel, { filterFields: ['city', 'stars'] }));

// Rooms (/available алдымен тұруы тиіс, әйтпесе :id деп қабылданады)
router.get('/rooms/available', room.searchAvailable);
mount('/rooms', room);

// Customers
mount('/customers', crud(Customer, { filterFields: ['email'] }));

// Bookings
router.route('/bookings').get(booking.list).post(booking.create);
router.route('/bookings/:id').get(booking.get).put(booking.update).delete(booking.remove);
router.patch('/bookings/:id/cancel', booking.cancel);
router.get('/bookings/:id/payments', payment.byBooking);

// Payments
router.route('/payments').get(payment.list).post(payment.create);
router.route('/payments/:id').get(payment.get).delete(payment.remove);
router.patch('/payments/:id/status', payment.updateStatus);

module.exports = router;
