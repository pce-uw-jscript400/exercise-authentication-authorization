const router = require('express').Router()
const bcrypt = require('bcrypt')
// const jsonwebtoken = require('jsonwebtoken')
const User = require('../models/user')

// const { SECRET_KEY } = process.env

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
        // const token = generateToken(guest._id)
        res.status(status).json({ status, user })
    } catch(e) {
        console.error(e)
        const error = new Error(`Account can't be created`)
        error.status = 400
        next(error)
    }
})

// router.post('/login', async (req, res, next) => {
//     const { username, password } = req.body
//     //find the user by username
//     const guest = await Guest.findOne({ username })
//     //if user exist, compare the plain text password to the hashed version
//     if (guest) {
//         const valid = await bcrypt.compare(password, guest.password)
//         if (valid) {
//         //if valid respond with success message
//         const status = 200
//         const response = 'You have successful logged in.'
//         // Create a JWT
//         const payload = { id: guest._id } //set up payload
//         const options = { expiresIn: '1 day' } //set expiration
//         const token = jsonwebtoken.sign(payload, SECRET_KEY, options)
//         // const token = generateToken(guest._id)
//         return res.status(status).json({ status, response, token })
//         }
//     }
    
//     const message = `Username or password incorrect. Please check credentials and try again.`
//     const error = Error(message)
//     error.status = 401
//     next(error)
// })

module.exports = router