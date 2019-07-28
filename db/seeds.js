const mongoose = require('mongoose')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')

// Add an admin User and a regular user to the ./db/seeds.js file:
// In the seeds.js file, when the reset() function is run, create a new User
// who has admin permissions and another User without admin permissions.
// Make sure that both users will be deleted and then recreated whenever the function is run.

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })
  await Book.deleteMany() // Deletes all records
  await User.deleteMany() // Delete all users
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
  const users = await User.create([
    {
      username: 'admin',
      password: '$2b$10$6gG3JWcaPVuaUxw.gl1v3eVwSKBfsFVC5pXy64Myoat5v8zZJkUT6',
      admin: true
    },
    {
      username: 'regular',
      password: '$2b$10$6gG3JWcaPVuaUxw.gl1v3eVwSKBfsFVC5pXy64Myoat5v8zZJkUT6',
      admin: false
    }
  ])
  return [books, users]
}

reset().catch(console.error).then((response) => {
  const recordsCreated = response[0].length + response[1].length
  console.log(`Seeds successful! ${recordsCreated} records created.`)
  return mongoose.disconnect()
})