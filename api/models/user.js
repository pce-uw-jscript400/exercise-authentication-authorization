const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: { 
    type: String,
    min: 8
  },
  admin: {
    type: Boolean,
    default: false
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

module.exports = mongoose.model('User', schema)