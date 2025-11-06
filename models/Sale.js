const mongoose = require("mongoose");

const SaleSchema = new mongoose.Schema({
  customerName: {
    type: String,
  },
  productType: {
    type: String,
  },
  productName: {
    type: String,
  },
  quantity: {
    type: Number,
  },
  unitPrice: {
    type: Number,
  },
  paymentType: {
    type: String,
  },
  salesAgent: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now
  },
  totalPrice: {
    type: Number,
  }
});

module.exports = mongoose.model("Sale", SaleSchema);
