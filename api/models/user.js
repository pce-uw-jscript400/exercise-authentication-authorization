const mongoose = require('mongoose')
const validatePassword = function(password) {
  return minlength(8)
};

//  Users have a username, a password, and an admin property which is set to false by default.

const schema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  admin: {
    type: Boolean,
    default: false,
    required: true
  }
})

module.exports = mongoose.model('User', schema)
