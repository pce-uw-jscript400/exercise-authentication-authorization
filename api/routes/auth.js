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
        const user = await User.create({
            username,
            password: hashed
        })
        console.log(`User ${username} created!`)

        //return success
        const payload = { id: user._id } //setup payload
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
        const isValid = await bcrypt.compare(password, guest.password)
        //throw error if issue with username/password
        if (!isValid) throw new Error(`Username and password do not match`)

        const payload = { id: guest._id }
        const options = { expiresIn: '1 day' }
        const token = jsonwebtoken.sign(payload, SECRET_KEY, options)
        res.status(status).json({status, token})
    } catch (e) {
        e.status = 401
        next(e)
    }
})

router.patch('/users/:id/permissions', async (req, res, next) => {
    const status = 204
    try {
        //make sure request body is OK - 400
        const permissions = req.body.admin
        const { id } = req.params
        if ( !(permissions === "true" || permissions === "false")) {
            const error = new Error(`There was a problem with your request body`)
            error.status = 400
            next(error)
        }

        //make sure headers contain auth - 401
        const token = req.headers.authorization.split('Bearer ')[1]
        if (!token) {
            const error = new Error(`There was a problem with your request`)
            error.status = 401
            next(error)
        }

        const payload = jsonwebtoken.verify(token, SECRET_KEY)

        const user = await User.findOne({ _id: payload.id }).select('-__v -password')
        //make sure request maker is an admin - 401
        const { admin } = user 
        if (admin !== true) {
            const error = new Error(`There was a problem with your request`)
            error.status = 401
            next(error)
        }

        //make sure user exists - 404
        const updatedUser = await User.findOne({_id: id})
        if (!updatedUser) {
            const error = new Error(`User ID: ${id} does not exist!`)
            error.status = 404
            next(error)
        }

        //need to verify this and make sure it is correct way to do..
        updatedUser.admin = permissions
        await updatedUser.save()

        res.status(status).send()

    } catch (e) {
        next(e)
    }
})

module.exports = router