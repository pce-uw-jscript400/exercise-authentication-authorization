const mongoose = require('mongoose')

const schema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  admin: false
})

module.exports = mongoose.model('User', schema)