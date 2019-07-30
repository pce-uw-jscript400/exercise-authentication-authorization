const mongoose = require('mongoose')
const Book = require('../api/models/book')
const User = require('../api/models/user')
const config = require('../nodemon.json')
const bcrypt = require('bcrypt')

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })

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


//Function to delete all existing user account in database and create 2 new seed users in database, one admin and another regular user.
const resetUsers = async () => {

  const rounds = 10
  const hashedOne = await bcrypt.hash('passwordOne', rounds)
  const hashedTwo = await bcrypt.hash('passwordTwo', rounds)

  await User.deleteMany() //Delete all USERS
  return await User.create([ //Create SEED Users
    {
      username: 'admin_user',
      password: hashedOne,
      admin: true
    },
    {
      username: 'regular_user',
      password: hashedTwo,
      admin: false
    }
  ])
}




reset().catch(console.error).then((response) => {
  console.log(`Seeds successful! ${response.length} book records created.`)
  return mongoose.disconnect()
})

resetUsers().catch(console.error).then((response) => {
  console.log(`Seeds successful! Created ${response.length} user records.`)
  return mongoose.disconnect()
})
