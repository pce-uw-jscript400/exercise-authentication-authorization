const router = require('express').Router()
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const {SECRET_KEY} = process.env

const saltRounds = 10;

// Add a post route for sign up
router.post('/signup', async (req, res, next) =>{
    var status = 201;
    try {
        const {username, password} = req.body;
        if (!username)
        {
            status = 400;
            throw new Error('Please provide a valid username');
        }
        if (!password)
        {
            status = 400;
            throw new Error('Please provide a valid password');
        }
        if(password.length < 8)
        {
            status = 400;
            throw new Error('Your password should be atleast 8 characters');
        }
        var user = await User.findOne({username});
        if (user)
        {
            status = 400;
            throw new Error('User already exists');
        }
        var hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const response = await User.create({username : username, password: hashedPassword});
        res.status(status).json({status, response})
    }
    catch(err){
        console.error(err);
        const error  = new Error(err.message)
        error.status = 400
        next(error)
    }
})

// Add a post route for login
router.post('/login', async (req, res, next) => {
    var status = 201;

    try{
        const {username, password} = req.body;
        var guest = await User.findOne({username})
        if (!guest)
        {
           throw new Error('User not found')
        }

        const isValid = await bcrypt.compare(password, guest.password)
        if (!isValid) throw new Error('Password is invalid');

        const payload = { id: guest._id } // Set up payload
        const options = { expiresIn: '1 day' } // Set up expiration
        const token = jsonwebtoken.sign(payload, SECRET_KEY , options)
        res.status(status).json({status, token})
    }
    catch(err){
        console.error(err);
        const error  = new Error('Login creds incorrect.')
        error.status = 400
        next(error)
    }
})

// Add a patch route for an admin to update another users admin privileges
// I am assuming here that the param that is passed in for :id is the username
router.patch('/users/:id/permissions', async (req, res, next) => {
    const status = 200
    try {
     // Check if A valid JWT token is not provided (status 401)
     const token = req.headers.authorization.split('Bearer ')[1]
     // Check if a token is provided
     if (!token)
     {
         status = 401;
         throw new Error(' No token present')
     }
     // Check if the token is valid
     const payload = jsonwebtoken.verify(token, SECRET_KEY)
     if (!payload)
     {
         status = 401;
        throw new Error('Invalid token')
     }

     // Check if request body has admin
     if(!req.body.admin)
     {
         status = 400;
         throw new Error('Body does not contain admin')
     }

     // Authentication
     const adminUser = await User.findOne({ _id: payload.id })
     if(!adminUser)
     {
         status = 401;
         throw new Error(' No admin user found')
     }

     if(!(adminUser.admin))
     {
         status = 401;
         throw new Error('User is not an admin')
     }

     const user = await User.findOneAndUpdate({ username : req.params.id}, { admin: req.body.admin }, { new: true })

     if(!user)
     {
        status = 404;
        throw new Error(' The requested user cannot be found');
     }

     res.json({ status, message:"Successfully updated admin privileges" });
    } catch (e) {
     console.error(e)
     const error = new Error(`Unable to update user permissions`)
     error.status = 404
     next(error)
    }
   })

module.exports = router