const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

const { SECRET_KEY } = process.env;

// const isAdmin = {
//   admin: true
// }

router.post('/signup', async (req, res, next) => {
  const status = 201
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })

    if (user) throw new Error(`User ${username} already exists.`) // Username is already taken
    if (username == null || username.length < 5) throw new Error(`Username must contain at least 5 characters.`)
    if (password == null || password.length < 8) throw new Error(`Password must contain at least 5 characters.`)

    // if (!isAdmin) throw new Error (`You are not an authorized user`)

    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    const newUser = await User.create({
      username,
      password: hashedPassword
    })

    // Create a JWT
    const payload = { id: newUser._id } // set up payload
    const options = { expiresIn: '1 day' } // sets up expiration
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options)

    // if all is well, responde with success message
    res.status(status).json({ status, token })
  } catch (e) {
    console.error(e)
    const error = new Error(`Login invalid`)
    error.status = 400
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  const status = 201
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) throw new Error(`Username could not be found`)

    // if it does exist, compare the plain text password to the hashed version
    const isValid = await bcrypt.compare(password, user.password)
    // if validation fails, throw an error
    if (!isValid) throw new Error(`Username and password do not match.`)

    // Create a JWT
    const payload = { id: user._id } // set up payload
    const options = { expiresIn: '1 day' } // sets up expiration
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options)

    // if all is well, responde with success message
    res.status(status).json({ status, token })
  } catch (e) {
    console.error(e)
    const error = new Error(`Login credentials incorrect.`)
    error.status = 400
    next(error)
  }
})

module.exports = router