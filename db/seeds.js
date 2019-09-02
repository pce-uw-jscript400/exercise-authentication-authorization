const mongoose = require('mongoose')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')
const bcrypt = require('bcrypt')

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


// Reset the user collection
await User.deleteMany() // Deletes all records
// Create 2 users with hashed passwords
const saltRounds = 10;

const adminPassword = await bcrypt.hash('CourseInstructor', saltRounds);
const userPassword = await bcrypt.hash('CourseStudent', saltRounds);
const user = User.create([
  {
    username : 'admin',
    password : adminPassword,
    admin : true
  },
  {
    username : 'katrina',
    password : userPassword
  }
])

  return { book, user }
}

reset()
  .catch(console.error)
  .then((response) => {
  console.log(`Seeds successful! ${response.book.length} book created. ${response.user.length} user created.`)
  return mongoose.disconnect()
})