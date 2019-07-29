const router = require('express').Router()
const bcryt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
const User = require('../models/user')

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

module.exports = router