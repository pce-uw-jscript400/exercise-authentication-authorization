
const { SECRET_KEY } = process.env
const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

// POST /api/signup
// Return error in following cases:
// Username is not provided - taken care of by required option in model
// Username is already taken
// Password is not provided - taken care of by required option in model
// Password is less than 8 characters - validated in model
router.post('/signup', async (req, res, next) => {
  const status = 201

  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (user) throw new Error(`User already exists`)
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    const response = await User.create({
      username,
      password: hashedPassword
    })
    res.status(status).json({ status, response })
  } catch (e)  {
    console.error(e)
    const error = new Error(`Unable to create user`)
    error.status = 400
    next(error)
  }
})

// POST /api/login

router.post('/login', async (req, res, next) => {
  const status = 201

  try {
    const { username, password } = req.body

    // finds user, if does not exist return error
    const user = await User.findOne({ username })
    if (!user) throw new Error(`User does not exist`)

    // compare the passwords, if they don't match return error
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error(`Password is invalid.`)

    // create JWT when logged in
    const payload = { id: user._id }
    const options = { expiresIn: '1 day' }
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options)

    res.status(status).json({ status, token: token })
  } catch (e)  {
    console.error(e)
    const error = new Error(`Invalid login credentials`)
    error.status = 401
    next(error)
  }
})

// PATCH /api/users/:id/permissions route:
router.patch('/users/:id/permissions', async (req, res, next) => {
 const status = 204
 try {
  // return error if no admin key provided
  if (!req.body.admin) throw new Error('No admin key provided')

  // Authorization first
  const token = req.headers.authorization.split('Bearer ')[1]
  const payload = jsonwebtoken.verify(token, SECRET_KEY)

  // Authentication
  const user = await User.findOne({ _id: payload.id })

  const isAdmin = user.admin

  // Error if not admin
  if (!isAdmin) throw new Error(`Access Denied: Must be Admin`)

  // If admin find user and update admin permissions
  await User.findOneAndUpdate(
    { _id: req.params.id},
    { admin: req.body.admin },
    { new: true }
  )

  res.json({ status })
 } catch (e) {
  console.error(e)
  const error = new Error(`Something went wrong`)
  error.status = 404
  next(error)
 }
})

module.exports = router