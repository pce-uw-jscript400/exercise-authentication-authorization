const mongoose = require('mongoose')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })
  await Book.deleteMany() // Deletes all records for books.
  await User.deleteMany() // Deletes all records for users.
  
  return await Book.create([
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
}

return await User.create([
  {
    username: 'superAdmin',
    password: 'Passw0rd1',
    admin: true
  },
  {
    username: 'User',
    password: 'Passw0rd',
    admin: false
  }
])

reset().catch(console.error).then((response) => {
  console.log(`Seeds successful! ${response.length} records created.`)
  return mongoose.disconnect()
})