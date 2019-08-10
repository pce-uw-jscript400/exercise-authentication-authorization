const router = require('express').Router()
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const User = require('../models/user')

const { SECRET_KEY } = process.env

router.post('/signup', async (req, res, next) => {
    const status = 201
    try {
        const { username, password } = req.body
        const saltrounds = 10
        const hashed = await bcrypt.hash(password, saltrounds)
        const alreadyExists = await User.findOne({ username })
        if (alreadyExists) {
            const error = new Error(`Username '${username}' is already taken.`)
            error.status = 400
            return next(error)
        }
        if (!req.body.username) throw new Error('Username is not provided')
        if (!req.body.password) throw new Error('Password is not provided')
        if (req.body.password.length < 8)
        throw new Error("Password is less than 8 characters");

        const user = await User.create({ username, password: hashed })
        // Create a JWT
        const payload = { id: user._id } //set up payload
        const options = { expiresIn: '1 day' } //set expiration
        const token = jsonwebtoken.sign(payload, SECRET_KEY, options)
        // const token = generateToken(user._id)
        res.status(status).json({ status, user, token })
    } catch(e) {
        console.error(e)
        const error = new Error(`Account can't be created`)
        error.status = 400
        next(error)
    }
})

router.post('/login', async (req, res, next) => {
    const { username, password } = req.body
    //find the user by username
    const user = await User.findOne({ username })
    //if user exist, compare the plain text password to the hashed version
    if (user) {
        const valid = await bcrypt.compare(password, user.password)
        if (valid) {
        //if valid respond with success message
        const status = 200
        const response = 'You have successful logged in.'
        // Create a JWT
        const payload = { id: user._id } //set up payload
        const options = { expiresIn: '1 day' } //set expiration
        const token = jsonwebtoken.sign(payload, SECRET_KEY, options)
        // const token = generateToken(guest._id)
        return res.status(status).json({ status, response, token })
        }
    }
    
    const message = `Username or password incorrect. Please check credentials and try again.`
    const error = Error(message)
    error.status = 401
    next(error)
})



router.patch('/users/:id/permissions', async (req, res, next) => {
    const status = 204
    try {
        const token = req.headers.authorization.split('Bearer')[1]
        const payload = jsonwebtoken.verify(token, SECRET_KEY)
        const user = await User.findById(id)
// * A valid JWT token is not provided (status 401)
        if (!payload) {
            status = 401;
            throw new Error('Invalid token')
        }
// * The JWT token is for a user who is not an admin (status 401)        
        const checkAdmin = await User.findOne({ _id: payload.req.params }).select('admin')
        if (!checkAdmin) {
            status = 401;
            throw new Error('The JWT token is for a user who is not an admin')
        }
 // * The request body does not include an `admin` key with a boolean value (status 400)
        if (!req.body.admin) {
            status = 400;
            throw new Error('Unauthorized')
        }
// * User cannot be found (status 404)
        if (!user) {
            error.status = 404
            throw new Error('User cannot be found')
        }   
        
    }   
})


module.exports = router