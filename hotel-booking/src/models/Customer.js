const { Schema, model } = require('mongoose');

const customerSchema = new Schema(
  {
    fullName: { type: String, required: [true, 'Аты-жөні міндетті'], trim: true },
    email: {
      type: String,
      required: [true, 'Email міндетті'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email форматы қате'],
    },
    phone: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = model('Customer', customerSchema);
