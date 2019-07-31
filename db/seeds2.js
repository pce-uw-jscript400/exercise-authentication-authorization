const mongoose = require('mongoose')
const User = require('../api/models/user')
const config = require('../nodemon.json')

const reset = async () => {
    mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })
  await User.deleteMany() // Deletes all records
  return await User.create(
  {
    username: 'userOne',
    password: 'passwordOne',
    admin: false
  },
  {
    username: 'adminOne',
    password: 'passwordOne',
    admin: true
  })
  
  }
  reset().catch(console.error).then((response) => {
    console.log(`Seeds successful! ${response.length} records created.`)
    return mongoose.disconnect()
  })