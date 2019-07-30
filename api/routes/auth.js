const router = require('express').Router()
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const {SECRET_KEY} = process.env
const User = require('../models/user')

const RouteError = (message, status) => {
  this.message = message;
  this.status = status;
}

router.post('/signup', async (req,res,next) => {
  try {
    const status = 201
    const {username, password, admin} = req.body
    if (!password || password.length < 8) throw new Error('Password must be at least 8 characters')
    const hashedPw = await bcrypt.hash(password, 10)
    const response = await User.create({
      username,
      password: hashedPw,
      admin
    })
    const payload = { id: response._id, admin: response.admin }
    const options = { expiresIn: '1 day' }
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options)

    res.status(status).json({
      status,
      response,
      token
    })
  } catch (e) {
    console.error(e)
    const error = new Error (e)
    error.status = 400
    next(error)
  }
})

router.post('/login', async (req,res,next) => {
  const status = 200
  try {
    const {username, password} = req.body
    const user = await User.findOne({username}).select('-__v -password')
    if (!user) throw new Error(`User ${username} could not be found`)
    const validated = bcrypt.compare(password, user.password)
    if (!validated) throw new Error(`Username and password do not match`)
    
    const payload = { id: user._id, admin: user.admin }
    const options = { expiresIn: '1 day' }
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options)

    res.status(status).json({
      status, 
      user,
      token
    })
    
  } catch (e) {
    console.error(e)
    const error = new Error ('New user creation failed')
    error.status = 401
    next(error)
  }
})

router.patch('/users/:id/permissions', (req, res, next) => {
  try {
    const status = 204
    if (!req.headers.authorization) throw new Error('Unauthorized')
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    if (!payload.admin) throw new Error('Unauthorized')
    const response = User.findByIdAndUpdate(payload.id, {$set: {admin: req.body.admin}}, {new: true})
    res.json({status, response})
  } catch (e) {
    console.log(e)
    const error = new Error (e)
    error.status = 401
    next(error)
  }
})

module.exports = router