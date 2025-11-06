const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')

const registrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  resetToken: {
  type: String,
  },
  resetTokenExpiry: {
  type: Date,
  },
});
registrationSchema.plugin(passportLocalMongoose,{
  usernameField:'email'
});
module.exports = mongoose.model('Registration', registrationSchema);