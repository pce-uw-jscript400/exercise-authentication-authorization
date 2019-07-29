const router = require('express').Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const { SECRET_KEY } = process.env

router.post('/signup', async (req, res, next) => {
    const status = 201
    const { username, password } = req.body

    try {
        const user = await User.findOne({ username })
        if (user !== null) {
            next({ status: 400, message: 'Existing username' })
        } else if (password.length < 8) {
            next({ status: 400, message: 'Password must be at least 8 characters' })
        } else {

            const hash = await bcrypt.hash(password, 10)

            const response = await User.create({ username: req.body.username, password: hash })
            const payload = { id: response._id, username: response.username }
            const options = { expiresIn: '1 day' }
            const token = jwt.sign(payload, SECRET_KEY, options)
            res.status(status).json({ status, token })
        }
    } catch (e) {
        console.error(e)
        const error = new Error(`Error signing up`)
        error.status = 400
        next(error)
    }

})

router.post('/login', async (req, res, next) => {
    const status = 200
    const { username, password } = req.body

    try {
        // find the user trying to log in
        const user = await User.findOne({ username })

        // if the user is not found, return an error
        if (user === null) {
            next({ status: 401, message: 'Username not found' })
        } else {
            // if a user is found, compare the entered password with the stored password
            const isValid = await bcrypt.compare(password, user.password)

            // if the passwords match, allow the login
            if (isValid) {
                const payload = { id: user._id, username: user.username }
                const options = { expiresIn: '1 day' }
                const token = jwt.sign(payload, SECRET_KEY, options)
                res.status(status).json({
                    status: status,
                    message: 'You are now logged in',
                    token: token
                })
            } else {
                next({ status: 401, message: 'Username/password is incorrect' })
            }
        }
    } catch (e) {
        console.error(e)
        const error = new Error(`Error logging in`)
        error.status = 400
        next(error)
    }
})

router.patch('/users/:id/permissions', async (req, res, next) => {
    const status = 204
    const { id } = req.params

    try {
        const token = req.headers.authorization.split('Bearer ')[1]

        const payload = jwt.verify(token, SECRET_KEY)
        if (!payload) {
            return next({ status: 401, message: 'A valid JWT token is not provided' })
        }

        const checkAdmin = await User.findOne({ _id: payload.id }).select('admin')

        if (!checkAdmin) {
            return next({ status: 401, message: 'The JWT token is for a user who is not an admin' })
        }

        const user = await User.findById(id)
        if (user === null) {
            return next({ status: 404, message: 'User cannot be found' })
        }

        if (!req.body.admin) {
            return next({ status: 400, message: 'The request body does not include an admin key with a boolean value' })
        }

        user.admin = true
        await user.save()

        const response = await User.findById(user._id).select('-__v')
        res.json({ status, response })

    } catch (e) {
        console.error(e)
        const error = new Error(`Error patching user permissions`)
        error.status = 400
        next(error)
    }
})

module.exports = router