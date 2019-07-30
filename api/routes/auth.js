const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const { sign, verify } = require('jsonwebtoken')
const { SECRET_KEY } = process.env

const generateToken = (id) => {
  const payload = { id }
  const options = { expiresIn: '1 day' }
  return sign(payload, SECRET_KEY, options)
}

router.post('/signup', async (req, res, next) => {
  const status = 201

  try {
    const { username, password } = req.body
    const rounds = 10
    const hashed = await bcrypt.hash(password, rounds)

    const alreadyExists = await User.findOne({ username })
    if (alreadyExists) {
      const error = new Error(`Username '${username}' is already taken.`)
      error.status = 400

      return next(error)
    } else {
      const user = await User.create({ username, password: hashed })
      const token = generateToken(user._id)

      res.status(status).json({ status, user, token })
    }

  } catch (error) {
    const e = new Error(error)
    e.status = 400
    next(e)
  }

})

router.post('/login', async (req, res, next) => {
  const status = 201

  try {
    const { username, password } = req.body

    const user = await User.findOne({ username })
    if (user) {
      const valid = await bcrypt.compare(password, user.password)
      if (valid) {
        const status = 200
        const response = 'You have successful logged in.'
        const token = generateToken(user._id)
        return res.status(status).json({ status, response, token })
      } else {
        const e = new Error('invalid login credentials')
        e.status = 400
        next(e)
      }
    } else {
      const e = new Error('username not found')
      e.status = 400
      next(e)
    }
  } catch (error) {
    const e = new Error(error)
    e.status = 400
    next(e)
  }
})


router.patch('/users/:id/permissions', async (req, res, next) => {
 const status = 204
 try {
  const token = req.headers.authorization.split('Bearer ')[1]
  const payload = jsonwebtoken.verify(token, SECRET_KEY)
  if (payload) { //if payload (token verification) returns true, cont.
    const currentUser = await User.findOne({ _id: payload.id  })
    if (currentUser.admin) { //if current user is admin, cont.
      const changeUser = await Users.findById(req.params.id)
      if (changeUser) { //if user to be changed exists, cont.
        changeUser.admin = true
        await changeUser.save()

        res.json({ status, changeUser })
      } else { //break if user to be changed does not exist
        const e = new Error('User not found')
        e.status = 404
        next(e)
      }
    } else { //break if current user is not admin
      const e = new Error('Current user does not have permission')
      e.status = 401
      next(e)
    }
  } else { //break for invalid payload (token verification)
    const e = new Error('Invalid token')
    e.status = 401
    next(e)
  }
} catch (error) {
    const e = new Error(error)
    e.status = 404
    next(e)
  }
})

module.exports = router
