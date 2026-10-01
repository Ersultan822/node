const { Schema, model } = require('mongoose');

const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['card', 'cash', 'transfer'], default: 'card' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = model('Payment', paymentSchema);
