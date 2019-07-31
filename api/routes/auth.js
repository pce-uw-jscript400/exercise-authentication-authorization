const { SECRET_KEY } = process.env
const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

router.post('/signup', async (req, res, next) => {
  const status = 201
  const { username, password, admin } = req.body
  try {
    if(!username) {
      return next({status: 400, message: 'Username was not provided.'})
    } 
    if(!password) {
      return next({status: 400, message: 'Password was not provided.'})
    } 
    if(password.length < 8) {
      return next({status: 400, message: 'Password is less than 8 characters.'})
    }

    // check to see if a user already exists with that name
    const user = await User.findOne({ username })
    // return an error if the user already exists
    if(user !== null) {
      return next({status: 400, message: 'Username is already taken.'})
    } 

    // if the user does not exist, hash the given password
    const hash = await bcrypt.hash(password, 12)
    // create a new user with the hashed password
    const response = await User.create({ username: username, password: hash })
    const payload = { id: response._id, username: response.username, admin: response.admin }
    const options = { expiresIn: '1 day' }
    const token = jwt.sign(payload, SECRET_KEY, options)
    res.status(status).json({ status, token })
  } catch (e) {
    console.error(e)
    next({ status: 500, message: e })
  }
})

router.post('/login', async (req, res, next) => { 
  const status = 200
  const { username, password } = req.body
  const failStatus = 401
  const failMessage = 'Username/Password is incorrect.'

  try {
    // find the user trying to log in
    const user = await User.findOne({ username })
    
    // if the user is not found, return an error
    if(user === null) {
      return next({status: failStatus, message: failMessage})
    }

    // if a user is found, compare the entered password with the stored password
    const isValid = await bcrypt.compare(password, user.password)
    // if the passwords match, allow the login
    if(isValid) {
      const payload = { id: user._id, username: user.username, admin: user.admin }
      const options = { expiresIn: '1 day' }
      const token = jwt.sign(payload, SECRET_KEY, options)
      res.status(status).json({ 
        status: status, 
        token: token
      })
    } else {
      return next({status: failStatus, message: failMessage})
    }
  } catch (e) {
    console.error(e)
    next({ status: 500, message: e })
  }
})

router.patch('/users/:id/permissions', async (req, res, next) => { 
  const status = 204
  const { admin } = req.body
  const { id } = req.params

  let payload;
  try {
    const token = req.headers.authorization.split('Bearer ')[1]
    payload = jwt.verify(token, SECRET_KEY)
  } catch (e) {
    return next({ status: 401, message: 'Invalid token.' })
  }

  try {
    if(payload.admin === false) {
      return next({ status: 401, message: 'Unauthorized.'})
    } 
    if(!('admin' in req.body)) {
      return next({ status: 400, message: 'Body must include admin value.'})
    } 
    
    const user = await User.findById(id)
    if(!user) {
      return next({ status: 404, message: 'User not found.'})
    } 
    
    user.admin = admin
    await user.save()
    res.status(status).send()
  } catch (e) {
    next({ status: 500, message: e })
  }
})

module.exports = router