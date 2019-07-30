const { SECRET_KEY } = process.env
const router = require('express').Router()
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const User = require('../models/user')

router.post('/signup', async (req, res, next) => {
  const status = 200
  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (user) throw new Error (`User already exists.`)
    
    //Create User, if user does not yet exist.
    const saltrounds = 12
    const hashPass = await bcrypt.hash(password, saltrounds)
    const response = await User.create({username, password: hashPass})

    res.status(status).json({ status, response })

  } catch (e) {
    console.error(e)

    const error = new Error('User already exists or does not meet validation requirements.')
    error.status = 422
    next(error)

    res.status(status).json({ status, message })

  }  

})

router.post('/login', async (req, res, next) => { 

  try {
    const { username, password } = req.body
    const user = await User.findOne({ username })
    if (!user) throw new Error('Username could not be found.')
      
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) throw new Error('Password is incorrect.')
  
  
    // JWT Create
    const status = 201
    const payload = { id: user._id}
    const options = { expiresIn: '1 hour'}
    const jwt = jsonwebtoken.sign(payload, SECRET_KEY, options)
    res.status(status).json({status, jwt})
  
  } catch (e) {
    status = 400
    console.error(e)
    const error = new Error('Unable to log in.')
    error.status = status

    res.status(status).json({ status, message })

    }
  

  })

router.patch('/:id/permissions', async (req, res, next) => { 
  try {
    validToken = tokenValidate(req);
    const user = await User.findOne({ _id: validToken.id })
  
    //Check for valid token
    if (!tokenValidate) { res.status(401).json({ status, response: 'Token is not valid.' })}
  
    //Check if admin value is boolean
    if (!typeof req.body.admin === "boolean"){ res.status(400).json({ status, response: 'Admin value is not boolean.' })}

    //Check if Admin
    if (!user.admin == true) { res.status(400).json({ status, response: 'User is not an Admin.' })
  
    //Try and see if user can be found,
    if (!user == null) {
         user.admin = req.body.admin
         const user = await User.save 
      } else { res.status(400).json({ status, response: 'User does not exist.' })}

    }
  } catch (e) {
    status = 422
    console.error(e)
    const error = new Error('An error occured.')
    error.status = status
    res.status(status).json({ status })

    }

  })


function tokenValidate(req) {
  const token = req.headers.authorization.split('Bearer ')[1]
  const payload = jsonwebtoken.verify(token, SECRET_KEY)
  
  return payload
} 

module.exports = router