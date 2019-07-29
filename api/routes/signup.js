const { SECRET_KEY } = process.env
const router = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')
const { sign, verify } = require('jsonwebtoken')

const generateToken = (id) => {
    const payload = { id }
    const options = { expiresIn: '1 day' }
    //console.log(SECRET_KEY)
    return sign( payload, SECRET_KEY, options)
}

//Create a POST /api/signup route: Create a new route that allows someone to create an
//account. Securely store the password using the bcrypt package. On successful creation,
//return a JWT token. You should return an error in the following cases:
//Username is not provided
//Username is already taken
//Password is not provided
//Password is less than 8 characters

router.post('/signup', async (req, res, next) => {
    try {
        const { username, password } = req.body
        if(!username){
            const error = new Error('Opps! The Username is empty')
            error.status = 400
            return next (error)
        }
        if(!password){
            const error = new Error('Opps! The Password field is empty')
            error.status = 400
            return next (error)
        }
        if(password.length < 8 ){
            const error = new Error('Opps!  Your password needs to be greater than 8 characters')
            error.status = 400
            return next (error)
        }
        const existingUser = await User.findOne({ username })
        if (existingUser){
            const error = new Error(`Username ${username} already exists. Please choose another username`)
            error.status = 400
            return next(error)
        }
        const rounds = 10
        const hashed = await bcrypt.hash(password, rounds)
        const status = 201
        const user = await User.create({username, password: hashed})
        const token = generateToken(User._id)
        res.status(status).json({status, token})

    } catch (e) {
      console.error(e)
      const message = 'Failure to create. Please check request body and try again.'
      const error = new Error(message)
      error.status = 400
      next(error)
    }
  })

  //Create a `POST /api/login` route
  //Create a new route that allows someone to login. On successful creation,
  //return a JWT token. You should return an error in the following cases:
  //Username is not found
  //Username and password do not match

  router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body
        const existingUser = await User.findOne({ username })
        if (!existingUser){
            const error = new Error(`No user with that username.  Please create an account`)
            error.status = 404
            return next(error)
        }

        const valid = await bcrypt.compare(password, existingUser.password)
        if(valid){
            const status = 200
            const token = generateToken(User._id)
            res.status(status).json({token})
        }

        const message = `Username or Password do not match. Please try again or create an account`
        const error = Error(message)
        error.status = 401
        next (error)


    } catch (e) {
      console.error(e)
      const message = 'Sorry. An unexpected failure occured.'
      const error = new Error(message)
      error.status = 404
      next(error)
    }
  })

 //Create a PATCH /api/users/:id/permissions route:
 //Create a new route that allows for an admin to change permissions of another user.
 //The route should only be looking for the admin: <boolean> key in the request body and setting
 //the value appropriately. On success, return a status 204. You should return an error in the
 //following cases:
 //A valid JWT token is not provided (status 401)
 //The JWT token is for a user who is not an admin (status 401)
 //User cannot be found (status 404)
 //The request body does not include an admin key with a boolean value (status 400)

 router.patch('/users/:id/permissions', async (req, res, next) =>{
     try {
         const userId = req.params.id
         const updateAdminTo = req.body.admin
         const token = req.headers.authorization.split('Bearer ')[1]

         const payload = verify(token, SECRET_KEY)

         const loggedInUser = await User.findOne({ _id: payload.id })

         if (!loggedInUser.admin) {
             // requester is not an admin 401
            const error = new Error('You do not have admin authorizations')
            error.status = 401
            return next (error)
         }

         if(typeof updateAdminTo !== 'boolean'){
            const error = new Error(`Admin value incorrect. Please check input`)
            error.status = 400
            return next(error)
         }

         const existingUser = await User.findOneAndUpdate({ _id: userId }, {admin: updateAdminTo}, {new: true})
         if (!existingUser){
            const error = new Error(`User cannot be found.`)
            error.status = 404
            return next(error)
         }

         const status = 204
         const response = "User Sucessfully Updated"
         res.json({status, response})

     } catch (e) {
        console.error(e)
        console.log(`Error Name: ${e.name}`)
        if(e.name === 'JsonWebTokenError'){
            const e = new Error("Invalid Token")
            e.status = 404
            next(e)
        }

        console.error(e)
        const message = 'Sorry. An unexpected failure occured.'
        const error = new Error(message)
        error.status = 404
        next(error)
     }
 })

  module.exports = router