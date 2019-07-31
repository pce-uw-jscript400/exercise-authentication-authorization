const router = require('express').Router()
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const User = require('../models/user')

router.post('/signup', async (req, res, next) => {
    const status = 201
try {
    const {username, password} = req.body
    const user = await User.findOne({username})
        if (user) throw new Error('User name is already in use')

    const saltRounds = 5
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    const response = await User.create({
        username,
        password: hashedPassword
    })
    res.status(status).json({status, response})
} catch (e) {
const error = new Error(e.message)
error.status = 400
next(error)
}
})

router.post('/login', async (req, res, next) => {
    const status = 201
    try {
        const {username, password} = req.body
        const user = await User.findOne({username})
        if (user === null) {
            throw new Error("Username - could not be found")
        }
        const goodLogin = await bcrypt.compare(password, user.password)
        if (goodLogin === null) {
            throw new Error('Username - Password combination could not be found')
        }
        const payload = {id: user._id}
        const options = {expiresIn: '1 day'}
        const token = jsonwebtoken.sign(payload, 'ASECRETPASSCODE', options)
        res.status(status).json({status, token})
    } catch (e) {
        const error = new Error('Password combination could not be found')
        error.status = 400
        next(error)
    }
})

module.exports = router