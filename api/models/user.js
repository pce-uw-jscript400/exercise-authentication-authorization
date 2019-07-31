const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    username: String,
    password: String,
    admin: {
        type: String,
        default: false
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', schema);