const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Users = require('../models/users')

const { SECRET_KEY } = process.env

// route for user signup
router.post('/signup', async (req, res, next) => {
    const status = 201
    try {
        // check that the request includes a username, otherwise throw error
        if (!req.body.username) throw new Error('Please enter a username.')
        // check that the request includes a password, otherwise throw error
        if (!req.body.password) throw new Error('Please enter a password.')
        // check that the password is at least 8 characters long
        if (req.body.password.length < 8) throw new Error('Password minimum is 8 characters.')

        const { username, password } = req.body
        // check to see if the user matches an existing user
        const user = await Users.findOne({ username })
        // if user already exists, throw error
        if (user) throw new Error(`User ${username} already exists.`)

        // set up the hash
        const saltRounds = 10
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        // create the user
        const response = await Users.create({
            username,
            password: hashedPassword
        })
        res.status(status).json({ status, response })

    } catch(e) {
        console.error(e)
        const error = new Error("Sorry, can't create account.")
        error.status = 400
        next(error)
    }
})

// route for user login
router.post('/login', async (req, res, next) => {
    const status = 200
    try {
        const { username, password } = req.body
        // check to see if user exists
        const user = await Users.findOne({ username })
        // if user does not exist, throw error
        if (!user) throw new Error('Username not found.')

        // verify the password
        const compare = await bcrypt.compare(password, user.password)
        // if password doesn't match, throw error
        if (!compare) throw new Error('Username and password do not match.')

        // set up the token
        const payload = { id: user._id }
        const options = { expiresIn: '1 day' }
        const token = jwt.sign(payload, SECRET_KEY, options)

        res.status(status).json({ status, token })

    } catch(e) {
        console.error(e)
        const error = new Error('Invalid username or password.')
        error.status = 401
        next(error)
    }
})

router.patch('/users/:id/permissions', async (req, res, next) => {
    const { id } = req.params
    
    try {
        // get token
        const token = req.headers.authorization.split('Bearer ')[1]
        // verify token
        const payload = jwt.verify(token, SECRET_KEY)
        // check if the token is valid. if it's not, throw an error
        if (!payload) {
            const error = new Error('Invalid token.')
            error.status = 404
            return next(error)
        }

        // get current user's admin status
        const checkAdmin = await Users.findOne({ _id: payload.id }).select('admin')
        // if current user isn't an admin, throw error
        if (checkAdmin.admin === false) {
            const error = new Error("You can't do this. You're not an admin!")
            error.status = 401
            return next(error)
        }

        // get user ID
        const user = await Users.findById(id)
        // if user can't be found, throw error
        if (!user) {
            const error = new Error('User cannot be found')
            error.status = 404
            return next(error)
        }

        // if the admin field isn't set in request body, throw error
        if (!req.body.admin) {
            const error = new Error("You didn't set the admin.")
            error.status = 400
            return next(error)
        }
  
        // set user to admin and save user
        user.admin = true
        await user.save()
      
        // return updated user record
        const response = await Users.findById(user._id).select('-__v')
        const status = 204
        res.json({ status, response })
    
    } catch (e) {
        console.error(e)
    }
  })


module.exports = router