# Қонақүйді брондау жүйесі

**Пән:** Веб-әзірлеу және NoSQL дерекқорлары · **Стек:** Node.js, Express, MongoDB (Mongoose), HTML/JS  
**Мақсаты:** бөлмелерді және клиенттердің броньдарын басқару (REST API + веб-интерфейс).

## Іске қосу

```bash
npm install
cp .env.example .env     # MONGO_URI баптау (әдепкі: mongodb://127.0.0.1:27017/hotel_booking)
npm run seed             # тест деректерін толтыру (міндетті емес)
npm start                # http://localhost:3000
```
MongoDB жергілікті іске қосылған болуы керек (немесе `.env`-ке MongoDB Atlas сілтемесін қойыңыз).

## Ресурстар (коллекциялар)

| Коллекция | Негізгі өрістер |
|---|---|
| Hotel | name, city, address, stars, phone, description |
| Room | hotel→Hotel, number, type, capacity, pricePerNight, amenities, status |
| Customer | fullName, email (unique), phone |
| Booking | customer→Customer, hotel→Hotel, room→Room, checkIn, checkOut, guests, nights, totalPrice, status, paymentStatus |
| Payment | booking→Booking, amount, method, status, paidAt |

Байланыстар: Hotel 1—N Room, Customer 1—N Booking, Room 1—N Booking, Booking 1—N Payment (ObjectId сілтемелері, `populate`).  
Индекстер: `Room {hotel, number}` unique, `Customer.email` unique, `Booking {room, checkIn, checkOut}`.

## REST API

| Әдіс | URL | Сипаттама |
|---|---|---|
| GET/POST | `/api/hotels` | қонақүйлер тізімі / құру (`?city=`) |
| GET/PUT/DELETE | `/api/hotels/:id` | |
| GET/POST | `/api/rooms` | бөлмелер (`?hotel=&type=`) |
| **GET** | **`/api/rooms/available`** | **бос бөлмелерді іздеу:** `checkIn, checkOut` (міндетті), `city, hotel, guests, type, maxPrice` |
| GET/PUT/DELETE | `/api/rooms/:id` | |
| GET/POST | `/api/customers` | клиенттер (`?email=`) |
| GET/PUT/DELETE | `/api/customers/:id` | |
| **POST** | **`/api/bookings`** | **бөлмені брондау** `{customer, room, checkIn, checkOut, guests}` |
| GET | `/api/bookings` | тізім (`?status=&paymentStatus=&customer=`) |
| GET | `/api/bookings/:id` | |
| **PUT** | **`/api/bookings/:id`** | **броньды өзгерту** (күндер, қонақ саны, бөлме) — бос екені қайта тексеріледі, баға қайта есептеледі |
| PATCH | `/api/bookings/:id/cancel` | броньнан бас тарту (төленген болса → `refunded`) |
| **DELETE** | **`/api/bookings/:id`** | **броньды жою** (төлемдерімен бірге) |
| POST | `/api/payments` | төлем жасау `{booking, method, amount?, status?}` |
| GET | `/api/payments`, `/api/payments/:id`, `/api/bookings/:id/payments` | **төлем статусын бақылау** |
| **PATCH** | **`/api/payments/:id/status`** | `pending / paid / failed / refunded` — Booking статусымен синхрондалады |

Жауап форматы: `{ "success": true, "data": ... }`. Қате кодтары: 400 (валидация), 404, 409 (бөлме бос емес / қайталану).

### Мысал сұраныстар (curl)

```bash
# Бос бөлмелер
curl "http://localhost:3000/api/rooms/available?checkIn=2026-10-10&checkOut=2026-10-13&city=Almaty&guests=2"

# Клиент құру
curl -X POST localhost:3000/api/customers -H "Content-Type: application/json" \
  -d '{"fullName":"Асель","email":"asel@example.com","phone":"+77010000000"}'

# Брондау
curl -X POST localhost:3000/api/bookings -H "Content-Type: application/json" \
  -d '{"customer":"<customerId>","room":"<roomId>","checkIn":"2026-10-10","checkOut":"2026-10-13","guests":2}'

# Төлеу → бронь автоматты түрде confirmed болады
curl -X POST localhost:3000/api/payments -H "Content-Type: application/json" \
  -d '{"booking":"<bookingId>","method":"card","status":"paid"}'
```

## Бос бөлмені анықтау логикасы

Екі кезең `[A, B)` және `[C, D)` қиылысады, егер `C < B` және `D > A`. Сондықтан `pending/confirmed` броньдары бар бөлмелер  
`{ checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }` сұранысымен табылып, `$nin` арқылы нәтижеден шығарылады.  
Бір күні бір адам кетіп, екіншісі келуі мүмкін (checkOut = келесі checkIn — қиылыспайды).

## Құрылым

```
server.js            — Express + MongoDB қосылу
seed.js              — тест деректері
src/models/          — Mongoose схемалары (5 коллекция)
src/controllers/     — бизнес-логика (crud, room, booking, payment)
src/routes/          — маршруттар
src/middleware/      — қателерді өңдеу
public/index.html    — веб-интерфейс
```

## Шектеулер / даму жолдары
- Авторизация жоқ (JWT қосуға болады).
- Бір мезгілде екі сұраныс бір бөлмені брондаса, толық қорғау үшін MongoDB транзакциясы (replica set) қажет.
- Төлем — имитация (нақты төлем шлюзі қосылмаған).
