const mongoose = require('mongoose')

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
    default: false
  }
})

module.exports = mongoose.model('User', schema)
