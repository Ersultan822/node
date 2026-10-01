const { Schema, model } = require('mongoose');

const bookingSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, min: 1, default: 1 },
    nights: { type: Number, min: 1 },
    totalPrice: { type: Number, min: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    // Төлем статусының көшірмесі (жылдам қарау үшін). Негізгі дерек — Payment коллекциясында
    paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'], default: 'unpaid' },
  },
  { timestamps: true }
);

// Бөлменің бос екенін тексеру сұранысына арналған индекс
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });

module.exports = model('Booking', bookingSchema);
