const mongoose = require('mongoose')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true, useCreateIndex: true })
  await Book.deleteMany() // Deletes all records
  await User.deleteMany() // Deleted all user records

  const book = await Book.create([
    {
      title: 'Good Omens: The Nice and Accurate Prophecies of Agnes Nutter, Witch',
      published: 1990,
      authors: [
        {
          name: 'Neil Gaiman',
          dob: '11-10-1960'
        },
        {
          name: 'Sir Terry Pratchett',
          dob: '04-28-1948'
        }
      ]
    }
  ])


const user = User.create([
  {
    username: 'Katrina',
    password: 'katrina1',
    admin: false
  }, 
  {
    username: 'Admin',
    password: 'admin111',
    admin: true
  }
])
return [book, user]

}

reset()
  .catch(console.error)
  .then((response) => {
  console.log(`Seeds successful! ${response.book.length} book created. ${response.user.length} user created.`)
  return mongoose.disconnect()
})