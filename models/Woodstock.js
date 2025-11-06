const mongoose = require('mongoose');

const woodstockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  supplier: {
    type: String,
    trim: true,
  },
  productPrice: {
    type: Number,
  },
  quantity: {
    type: Number,
  },
  quality: {
    type: String,
  },
  color: {
    type: String,
  },
  measurements: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now
  },
  image: {
    type: String,
  }
});

module.exports = mongoose.model('Wood', woodstockSchema);