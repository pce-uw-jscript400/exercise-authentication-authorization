const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'You must provide a username']
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('User', schema)