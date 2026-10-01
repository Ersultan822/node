require('dotenv').config();
const mongoose = require('mongoose');
const Hotel = require('./src/models/Hotel');
const Room = require('./src/models/Room');
const Customer = require('./src/models/Customer');
const Booking = require('./src/models/Booking');
const Payment = require('./src/models/Payment');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotel_booking');
  await Promise.all([Hotel, Room, Customer, Booking, Payment].map((m) => m.deleteMany({})));

  const [h1, h2] = await Hotel.create([
    { name: 'Rixos Almaty', city: 'Almaty', address: 'Кабанбай батыр 109', stars: 5, phone: '+7 727 000 00 01', description: 'Орталықтағы 5 жұлдызды қонақүй' },
    { name: 'Astana Inn', city: 'Astana', address: 'Қабанбай батыр 15', stars: 4, phone: '+7 717 000 00 02', description: 'Бизнес-қонақүй' },
  ]);

  const rooms = [];
  for (const [h, prefix, base] of [[h1, 1, 45000], [h2, 2, 30000]]) {
    [['01', 'single', 1, base * 0.6], ['02', 'double', 2, base], ['03', 'double', 2, base], ['04', 'family', 4, base * 1.5], ['05', 'suite', 3, base * 2.2]].forEach(
      ([n, type, capacity, price]) =>
        rooms.push({ hotel: h._id, number: `${prefix}${n}`, type, capacity, pricePerNight: Math.round(price), amenities: ['Wi-Fi', 'TV', 'Кондиционер'] })
    );
  }
  const createdRooms = await Room.create(rooms);

  const [c1, c2] = await Customer.create([
    { fullName: 'Айжан Сериккызы', email: 'aizhan@example.com', phone: '+7 701 111 22 33' },
    { fullName: 'Данияр Ахметов', email: 'daniyar@example.com', phone: '+7 702 444 55 66' },
  ]);

  const day = 86400000;
  const inD = new Date(Date.now() + 3 * day);
  const outD = new Date(Date.now() + 6 * day);
  const r = createdRooms[1];
  const b = await Booking.create({
    customer: c1._id, hotel: r.hotel, room: r._id, checkIn: inD, checkOut: outD,
    guests: 2, nights: 3, totalPrice: 3 * r.pricePerNight, status: 'confirmed', paymentStatus: 'paid',
  });
  await Payment.create({ booking: b._id, amount: b.totalPrice, method: 'card', status: 'paid', paidAt: new Date() });

  console.log('Seed дайын: 2 қонақүй, 10 бөлме, 2 клиент, 1 бронь, 1 төлем');
  await mongoose.disconnect();
})();
