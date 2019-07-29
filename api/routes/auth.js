const router = require('express').Router()
const bcryt = require('bcrypt')
const { sign, verify} = require('jsonwebtoken')
const User = require('../models/user')

const { SECRET_KEY } = process.env

router.post('/signup', async (req, res, next) => {
    const status = 201
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        if (user) throw new Error(`Username ${username} already taken.`)
        if (!username) throw new Error(`Username has not been provided.`)
        if (!password) throw new Error(`Password has not been provided.`)
        if (password.length.toString() < 8) throw new Error(`Password must be at least 8 characters.`)
        const saltRounds = 10
        const hashedPassword = await bcryt.hash(password, saltRounds)
        const response = await User.create({
            username,
            password: hashedPassword
        })
        res.status(status).json({ status, response})
    } catch (e) {
        console.error(e)
        const error = e 
        error.status = 400
        next(e)
    }
})

  router.post('/login', async (req, res, next) => {
    const status = 201
    try {
        const { username, password } = req.body 
        const user = await User.findOne({ username })
        console.log(user)
        if (!user) throw new Error(`User could not be found.`)
        const payload = { id: user._id } // Set up payload
        const options = { expiresIn: '1 day' } // Sets expiration
        const token = sign(payload, SECRET_KEY, options)
        const isValid = await bcryt.compare(password, user.password)
        if (!isValid) throw new Error(`Username and password do not match`)
        res.status(status).json({ status, token, response: `You have been logged in.`})
    } catch (e) {
        console.error(e)
        const error = e
        error.status = 400
        next(error)
    }
})

router.patch('/users/:id/permissions', async (req, res, next) => {
    
    const status = 201
    const { id } = req.params
    const { admin } = req.body
    try {
        const token = req.headers.authorization.split('Bearer ')[1]
        const payload = verify(token, SECRET_KEY)
        if (!payload) throw new Error(`A valid JWT token is not provided.`)

        const checkAdmin = await User.findOne({ _id: payload.id }).select(`admin`)
        if (!checkAdmin) throw new Error(`The JWT token is for a user who is not an admin.`)
        
        user = await User.findOne({ id })
        if (!admin) throw new Error(`User cannot be found.`)
        
        if (!user) throw new Error(`The request body does not include an admin key with a boolean value.`)
 
        user.admin = true
        await user.save()
        const response = await User.findById(user._id).select('-__v')
        res.json({ status, response })
    } catch (e) {
        console.error(e)
        const error = e
        error.status = 401
        next(error)
      }
})

module.exports = router