const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })
  await Book.deleteMany() // Deletes all records
  await User.deleteMany() // Deletes all records
  const bookResponse = await Book.create([
    {
      title: 'The Colour of Magic',
      published: 1983,
      authors: [
        {
          name: 'Sir Terry Pratchett',
          dob: '04-28-1948'
        }
      ]
    },
    {
      title: 'Stardust',
      published: 1997,
      authors: [
        {
          name: 'Neil Gaiman',
          dob: '11-10-1960'
        }
      ]
    },
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

  const saltRounds = 10
  const adminHashedPassword = await bcrypt.hash('administrator', saltRounds)
  const userHashedPassword = await bcrypt.hash('regularuser', saltRounds)
  
  const userResponse = await User.create([
    {
      "username": "admin",
      "password": adminHashedPassword,
      admin: true
    },
    {
      "username": "user",
      "password": userHashedPassword
    }
  ])
  return {bookResponse, userResponse}
}

reset().catch(console.error).then((response) => {
  console.log(`Seeds successful! ${response.bookResponse.length} books created.`)
  console.log(`Seeds successful! ${response.userResponse.length} users created.`)
  return mongoose.disconnect()
})