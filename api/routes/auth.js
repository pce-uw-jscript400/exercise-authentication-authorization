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

        // Had issues getting the compare to work
        await bcrypt.compare(password, (err, res) =>{
            if(res) throw new Error(`User password already taken`)
        })

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
          if (!isValid) throw new Error('Password is invalid')

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

  router.get('/profile', async (req, res, next) => {
    try {
      const token = req.headers.authorization.split('Bearer ')[1]
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