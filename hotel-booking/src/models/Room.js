const { Schema, model } = require('mongoose');

const roomSchema = new Schema(
  {
    hotel: { type: Schema.Types.ObjectId, ref: 'Hotel', required: [true, 'hotel міндетті'], index: true },
    number: { type: String, required: [true, 'Бөлме нөмірі міндетті'], trim: true },
    type: { type: String, enum: ['single', 'double', 'suite', 'family'], default: 'double' },
    capacity: { type: Number, required: true, min: 1, default: 2 },
    pricePerNight: { type: Number, required: [true, 'Бағасы міндетті'], min: 0 },
    amenities: [{ type: String, trim: true }],
    status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
  },
  { timestamps: true }
);

// Бір қонақүйде бөлме нөмірі қайталанбайды
roomSchema.index({ hotel: 1, number: 1 }, { unique: true });

module.exports = model('Room', roomSchema);
