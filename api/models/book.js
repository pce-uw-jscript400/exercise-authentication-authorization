const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  authors: [{
    name: String,
    dob: Date
  }],
  published: Number,
  reserved: {
    status: {
      type: Boolean,
      default: false
    },
    memberId: mongoose.ObjectId
  },
  title: {
    type: String,
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

module.exports = mongoose.model('Book', schema)