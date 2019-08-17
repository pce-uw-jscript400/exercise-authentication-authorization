const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = process.env

router.post('/signup', async (req, res, next) => {
    const status = 201
    try {
        const { username, password } = req.body
        // Username is not provided
        if (!username) throw new Error (`Username not provided.`)
        // Username is already taken
        const alreadyUsername = await User.findOne({username})
          .select('-__v -password')
        if (alreadyUsername) throw new Error (`Username already taken.`)

        // Password is not provided
        if (!password) throw new Error (`Password not provided.`)
        // password is less than 8 characters
        if (password.length < 8) throw new Error (`Password is less than 8 characters.`)

        const hashedPassword = await bcrypt.hash(password, saltRounds)
        const user = await User.create({
            username,
            password: hashedPassword
        })

        const payload = { id: user._id }
        const options = { expiresIn: '1 day' }
        const token = jwt.sign(payload, SECRET_KEY, options)

        res.json({ status, token })    
    } catch (e) {
        e.status = 400
        console.error(e)
        next(e)
    }
})


router.post('/login', async (req, res, next) => {
    const status = 201
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username})
          .select('-__v -password')
        // Username is not found
        if (!user) throw new Error (`Incorrect login credentials.`)
        
        // If username does exist, compare the plain text password the the hashed version
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) throw new Error(`Incorrect login credentials.`)

        const payload = { id: user._id }
        const options = { expiresIn: '1 day' }
        const token = jwt.sign(payload, SECRET_KEY, options)

        res.json({ status, token })
    } catch (e) {
        console.error(e)
        const error = new Error ('Incorrect login credentials')
        error.status = 401
        next(error)
    }
})

// PATCH /api/users/:id/permissions to change admin permissions of another user
// Finds admin: <boolean> key in req.body
// Returns 204
router.patch('/api/users/:id/permissions', async (req, res, next) => {
    const status = 204
    try {
        const { admin } = req.body
        // Request body does not include an admin key with a boolean value 400
        if (!( admin === true || admin === false)) {
            const error = new Error (`Invalid request.`)
            error.status = 400
            next(error)
        }

        //  Valid JWT is not provided 401
        const token = req.headers.authorization.split('Bearer ')[1]
        if (!token) {
            const error = new Error (`Invalid token.`)
            error.status = 401
            next(error)
        }
        const payload = jsonwebtoken.verify(token, SECRET_KEY)
        
        // JWT token is for a user who is not an admin 401
        const clientUser = await User.findOne({ _id: payload.id })
          .select('-__v -password')
        if (!clientUser.admin === true) {
            const error = new Error (`Insufficient privelages.`)
            error.status = 401
            next(error)
        }

        // User cannot be found 404
        const userToUpdate = await User.findOne({_id: req.params.id})
          .select('-__v -password')
        if (!userToUpdate) {
            const error = new Error (`User cannot be found.`)
            error.status = 404
            next(error)
        }

        Object.assign(userToUpdate, admin)
        await user.save()
      
        res.json({ status, user })
    } catch (e) {
        console.error(e)
        next(e)
    }
})

module.exports = router