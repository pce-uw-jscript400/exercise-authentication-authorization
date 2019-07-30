const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const saltRounds = 10
const { SECRETKEY } = process.env

router.post('/signup', async(req, res, next) => {
    const status = 201
    try {
        const { username, password } = req.body
            // check if user is already in database
        user = await User.findOne({ username })
        if (user) throw new Error('Already user')
            // check password for presence and length
        if (!password) throw new Error('Missing Password')
        if ((password.length < 8)) throw new Error('Not enough password - min 8')
            // create hashed passsword
        const hashedPassword = await bcrypt.hash(password, saltRounds)
        user = await User.create({ username, password: hashedPassword })
            // set up token details to create login for newly created user
        const payload = { id: user._id }
        const options = { expiresIn: '1 day' }
            // create token for user
        const token = jsonwebtoken.sign(payload, SECRETKEY, options)
        const response = token
        res.status(status).json({ status, response })
    } catch (e) {
        console.error(e)
        const error = new Error(`Extra Error`)
        error.status = 400
        next(error)
    }


})

router.post('/login', async(req, res, next) => {
    const status = 201
    try {
        const { username, password } = req.body
            // check if user is in database
        user = await User.findOne({ username })
        if (!user) throw new Error('Not user!')
            // check password validity
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) throw new Error('Could not login')
            // send token
        const payload = { id: user._id }
        const options = { expiresIn: '1 day' }
            // create token for user
        const token = jsonwebtoken.sign(payload, SECRETKEY, options)
        const response = token
        res.status(status).json({ status, response })
    } catch (e) {
        console.error(e)
        const error = new Error(`Extra Error`)
        error.status = 400
        next(error)
    }


})
router.patch('/:id/permissions', async(req, res, next) => {
    const status = 201
    try {
        const token = req.headers.authorization.split('Bearer ')[1]
        const userToken = jsonwebtoken.verify(token, SECRETKEY)
        if (!userToken) {
            const error = new Error('Please login')
            error.status = 401
            return next(error)
        }

        const user = await User.findOne({ _id: userToken.id })

    } catch (e) {

    }


})

module.exports = router