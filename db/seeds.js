const mongoose = require('mongoose')
const Book = require('../api/models/book')
const Users = require('../api/models/users')
const config = require('../nodemon.json')
const bcrypt = require('bcrypt')

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true, useCreateIndex: true })
  await Book.deleteMany() // Deletes all books
  await Users.deleteMany() // Deleted all users

  // create initial books
  const books = await Book.create([
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

  // create users
  const users = await Users.create([
    {
      username: "bobsmith",
      password: bcrypt.hashSync("lalalalalalala", 10)
    },
    {
      username: "johndoeadmin",
      password: bcrypt.hashSync("you'llneverguess", 10),
      admin: true
    }
  ])

  return { books, users }
}

reset().catch(console.error).then((response) => {
  console.log(`Seeds successful! ${response.books.length} books created and ${response.users.length} users created.`)
  return mongoose.disconnect()
})