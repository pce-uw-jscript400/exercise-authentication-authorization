const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

const { SECRET_KEY } = process.env;

// - [ ] **Create a `POST /api/signup` route:** Create a new route that allows someone to create an account. Securely store the password using the `bcrypt` package. On successful creation, return a JWT token. You should return an error in the following cases:
//   * Username is not provided
//   * Username is already taken
//   * Password is not provided
//   * Password is less than 8 characters

router.post('/signup', async (req, res, next) => {
  const status = 201
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (user) throw new Error(`User ${username} already exists`)

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
    const error = new Error(`You can't come to this party.`)
    error.status = 400
    next(error)
  }
})

module.exports = router