const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Users = require('../models/users')
const bcrypt = require('bcrypt')

const { SECRET_KEY } = process.env

router.post('/signup', async (req, res, next) => {
    const status = 201
    try{
        const { username, password } = req.body
        const user = await Users.findOne({username})
        
        if (user) throw new Error(`User ${username} already taken.`)
        if (!username) throw new Error(`Username is not provided!`)

        const isValid = (password.length > 8)
        // If validation fails, throw and error
        if (!isValid) throw new Error('Password must be 8 characters or more.')

        if (!password) throw new Error(`Password is not provided!`)
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const response = await Users.create({
            username,
            password: hashedPassword
        })
        res.status(status).json({ status, response})
    } catch (e){
        console.error(e)
        const error = new Error(`You can't check out a book.`)
        error.status = 400
        next(error)
    }
  })

  router.post('/login', async(req, res, next) => {
      const status = 201
      try{
          const { username, password } = req.body
          //Find the user by username
          const user = await Users.findOne({ username })
          // If it doesn't exist, throw an error
          if (!user) throw new Error('Username could not be found.')

          //if it does exist, compare the plain text password to the hashed version
          const isValid = await bcrypt.compare(password, user.password)
          // If validation fails, throw and error
          if (!isValid) throw new Error('Username and password do not match')

          // Create a JWT
          const payload = { id: user._id } // Setup payload
          const options = { expiresIn: '1 day'}
          const token = jwt.sign(payload, 'SECRET_KEY', options)
          // If all is well, respond with a success message
          res.status(status).json({ status, token})
      } catch (e){
          console.error(e)
          const error = new Error( `Login credentials incorrect.`)
          error.status = 400
          next(error)
      }
  })

  router.patch('/api/users/:id/permissions', async (req, res, next) => {
    const status = 204
      try {
        const jwtstatus = 401
        const nullUserStatus = 404
        const adminKeyStatus = 400
        const token = req.headers.authorization.split('Bearer ')[1]
        if (!token) throw new Error(`A valid JWT token is not provided ${jwtstatus}`)

        const payload = jwt.verify(token, SECRET_KEY)
        const user = await Users.findOne({ _id: payload.id }).select('-__v -password')
        if (user.admin != true) throw new Error(`The JWT token is for a user who is not an admin ${jwtstatus}`)
        if (!user) throw new Error(`User cannot be found ${nullUserStatus}`)

        const {username, admin} = req.body
        const userUpdate = await Users.findOne({username})
        if (!userUpdate) throw new Error(`No user found with that ${username}`)
        if(!admin) throw new Error(`The request body does not include an 'admin' key with a boolean value ${adminKeyStatus}`)
        const response = await Users.save({admin})
        res.status(status).json({ status, response})
      } catch (e){
        console.error(e)
        const error = new Error('You are not authorized to access this route.')
        error.status = 401
        next(error)
      }
    
  })

  router.get('/profile', async (req, res, next) => {
    try {
      const token = req.headers.authorization.split('Bearer ')[1]
    //   const secret = new Buffer.alloc(SECRET_KEY, "base64")
      const payload = jwt.verify(token, SECRET_KEY)
      const user = await Users.findOne({ _id: payload.id }).select('-__v -password')
      const status = 200
      res.json({ status, user })  
    } catch (e) {
      console.error(e)
      const error = new Error('You are not authorized to access this route.')
      error.status = 401
      next(error)
    }
  })

  module.exports = router