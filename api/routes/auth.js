const router = require('express').Router()
const bcrypt = require('bcrypt');
const { sign, verify } = require('jsonwebtoken');
const User = require('../models/user')
const { SECRET_KEY } = process.env

const generateToken = (id) => {
    const payload = { id }
    const options = { expiresIn: '1 day' }
    return sign(payload, SECRET_KEY, options)
}

router.use(async (req, res, next) => {
    try{
      delete req.user
      const token = req.headers.authorization.split('Bearer ')[1]
      const payload = verify(token, SECRET_KEY)
      const user = await User.findOne({ _id: payload.id }).select('-__v -password')
      if(user){
        req.user = user
      }
    }finally{
      next()
    }
  })

router.get('/profile', async (req, res, next) => {
    try {
        //Get the token from the authorization header
        const token = req.headers.authorization.split('Bearer ')[1]
        //Get the payload, in particular the user id
        const payload = verify(token, SECRET_KEY)
        //Get all infomration about the user from the database, minus the password
        const user = await User.findOne({ _id: payload.id }).select('-__v -password')

        const status = 200
        res.json({ status, user })
    } catch (e) {
        //If anything at all goes wrong, we can not authorize the user.  Better safe than sorry.
        console.error(e)
        const error = new Error('You are not authorized to access this route.')
        error.status = 401
        next(error)
    }
})

router.post('/signup', async (req, res, next) => {
    const status = 201
    const { username, password } = req.body
    const saltRounds = 10

    if(!username){
        const error = new Error(`Username is required.`)
        error.status = 400
        return next(error)
    }

    if(!password){
        const error = new Error(`Password is required.`)
        error.status = 400
        return next(error)
    }

    if(password.length < 8){
        const error = new Error(`Password must be at least 8 characters.`)
        error.status = 400
        return next(error)
    }


    const alreadyExists = await User.findOne({ username })
 
    if (alreadyExists) {
        const error = new Error(`Username '${username}' is already taken.`)
        error.status = 400
        return next(error)
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const user = await User.create({
            username: username,
            password: hashedPassword
        })
        const token = generateToken(user._id)
        res.status(status).json({ status, token })
    } catch (error) {
        console.log(error)
        if (error.name === 'ValidationError') {
            res.status(400).json({ status: 400, response: error.message })
        } else {
            res.status(500).json({ status: 500, response: error.message })
        }
    }
})

router.post('/login', async (req, res, next) => {
    const status = 200
    try {
        const { username, password } = req.body;
        
        //See if the username exists
        const user = await User.findOne({ username })
        if (!user) {
            //The username does not exist
            throw new Error(`Username could not be found`)
        }
        
        //Given that the username exists, see if the password matches
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            //The username exists but the password is wrong
            throw new Error(`Password is invalid`)
        }
        //Give the user a token that they can use for future use of APIs.
        const token = generateToken(user._id)
        res.status(status).json({ status, token })
    } catch (error) {
        console.error(error)
        //Give an undetailed message to make it harder for hackers
        const err = new Error(`Login credentials incorrect.`)
        err.status = 401
        next(err)
    }
})

router.patch('/:id/permissions', async (req, res, next) => {
    if(!req.user || req.user.admin == false){
        const error = new Error(`Unauthorized`)
        error.status = 401
        return next(error)
    }
    const userToModify = req.body
    const { id } = req.params

    if(!userToModify.admin){
        const error = new Error(`admin field is required`)
        error.status = 400
        return next(error)
    }
    const status = 204
    const user = await User.findById(id).select('-__v')
    if(!user){
        const error = new Error(`User ${id} not found.`)
        error.status = 404
        return next(error)
    }
    Object.assign(user, userToModify)
    await user.save()
    res.status(status)
})

module.exports = router