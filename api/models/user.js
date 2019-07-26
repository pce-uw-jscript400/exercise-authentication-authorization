const mongoose = require('mongoose')

const schema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password : {
        type: String,
        requried: true
    },
    admin: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('User', schema)