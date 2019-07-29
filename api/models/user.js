const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true);

const schema = new mongoose.Schema({
    user: {
      type: String,
      unique: true,
      index: true,
      required: true
    },
    password: {
        type:String,
        required:true
        
    },
    admin:{
        type:Boolean,
        default: false
    }
  }, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

module.exports = mongoose.model('User', schema)