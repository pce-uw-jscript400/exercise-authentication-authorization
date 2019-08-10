const mongoose = require('mongoose')
const Book = require('../api/models/book')
const Users = require('../api/models/users')
const config = require('../nodemon.json')
const bcrypt = require('bcrypt')

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true })
  await Book.deleteMany() // Deletes all records
  await Users.deleteMany()
  const saltRounds = 10
  const jasonpass = 'T$mp1234'
  const shazpass = 'shazam*17'
  const jasonpasshased = await bcrypt.hash(jasonpass, saltRounds)
  const shazpasshashed = await bcrypt.hash(shazpass, saltRounds)
  
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
  ]),
  Users.create([
    {
      username : "Shazam",
      password : shazpasshashed,
      admin : true
    },
    {
      username : "Jason",
      password : jasonpasshased,
      admin : false
    }
  ])
}

reset().catch(console.error).then((response) => {
  console.log(`Seeds successful! ${response.length} records created.`)
  return mongoose.disconnect()
})