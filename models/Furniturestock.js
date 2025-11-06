const mongoose = require('mongoose');

const furniturestockSchema = new mongoose.Schema({
  furnitureName: {
    type: String,
    required: true,
    trim: true,
  },
  productPrice: {
    type: Number,
    required: true,
  },
  quantity: {
    type: String,
  },
  quality: {
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

module.exports = mongoose.model('Furniture', furniturestockSchema);