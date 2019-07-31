const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  username: {
      type: String,
      required: [true, 'username required'],
      unique: [true, 'username already exists']
  },
  password: {
    type: String,
    required: [true, 'Password required'],
    minlength: [8, 'Password must be 8 or more characters']
   },
  admin: {
      type: Boolean,
      default: false
    },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

module.exports = mongoose.model('User', schema)