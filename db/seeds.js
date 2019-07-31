const mongoose = require('mongoose')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')
const bcrypt = require('bcrypt')

const resetUsers = async () => {
  await User.deleteMany() // Deletes all records
  return await User.create([
    {
      username: 'admin',
      password: await bcrypt.hash('admin', 12),
      admin: true
    },
    {
      username: 'user',
      password: await bcrypt.hash('user', 12),
      admin: false
    }
  ])
}

const resetBooks = async () => {
  await Book.deleteMany() // Deletes all records
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

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })
  const books = await resetBooks()
  const users = await resetUsers()
  return { books, users }
}

reset().catch(console.error).then((response) => {
  console.log(`Seeds successful! ${response.books.length} book records created.`)
  console.log(`Seeds successful! ${response.users.length} user records created.`)
  return mongoose.disconnect()
})