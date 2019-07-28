const mongoose = require('mongoose')

const schema = mongoose.Schema({
    username: String,
    password: String,
    admin: false
})

module.exports = mongoose.model('Users', schema)