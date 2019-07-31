const mongoose = require('mongoose')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')
const bcrypt = require('bcrypt')

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })

  // Reset the books collection

  await Book.deleteMany() // Deletes all records
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


// Reset the user collection
await User.deleteMany() // Deletes all records
// Create 2 users with hashed passwords
const saltRounds = 10;

const adminPassword = await bcrypt.hash('CourseInstructor', saltRounds);
const userPassword = await bcrypt.hash('CourseStudent', saltRounds);
const users = User.create([
  {
    username : 'WesReid',
    password : adminPassword,
    admin : true
  },
  {
    username : 'Soma',
    password : userPassword
  }
])

// Return both books and users
return (books, users);
}

// response here returns only the last await response which in this case happens to be users
reset().catch(console.error).then((response) => {
  console.log(`Seeds successful! , Books and user records created`)
  return mongoose.disconnect()
})