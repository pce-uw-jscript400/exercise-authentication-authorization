const { SECRET_KEY } = process.env
const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

router.post('/signup', async (req,res, next) => {
    const status = 201

    try {
        const { username, password } = req.body

        //throw errors if malformed input
        if (!(username && password)) throw new Error(`Username & password are required!`)
        if (password.length < 8) throw new Error(`Please choose a longer password`)

        const guest = await User.findOne({username})
        //if user already exists, throw error
        if (guest) throw new Error(`User: ${username} already exists!`)
        
        //store user in database
        const saltRounds = 10
        const hashed = await bcrypt.hash(password, saltRounds)
        await User.create({
            username,
            password: hashed
        })
        console.log(`User ${username} created!`)

        //return success
        const payload = { id: guest._id } //setup payload
        const options = { expiresIn: '1 day' } //add expiration
        const token = jsonwebtoken.sign(payload, SECRET_KEY, options) //create token

        res.status(status).json({status, token})

    } catch (e) {
        e.status = 400
        next(e)
    }
})

router.post('/login', async (req, res, next)=> {
    const status = 201
    try{
        const { username, password } = req.body
        //throw error if no username
        if (!username) throw new Error(`Username required to login`)

        const guest = await User.findOne({username})
        const isValid = bcrypt.compare(password, guest.password)
        //throw error if issue with username/password
        if (!isValid) throw new Error(`Username and password do not match`)

        const payload = { id: guest._id }
        const options = { expiresIn: '1 day' }
        const token = jsonwebtoken.sign(paylod, SECRET_KEY, options)
        res.status(status).json({status, token})
    } catch (e) {
        e.status = 401
        next(e)
    }
})


module.exports = router