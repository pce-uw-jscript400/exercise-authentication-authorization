const { SECRET } = process.env
const router = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const helper = require('../helper/helper')

//Function to generate and return Token
const generateMyToken = (id, admin) => {
  const payload = { id, admin }
  const options = { expiresIn: '1 day' }
  const token = jwt.sign(payload, SECRET, options)
  return token
}


//SIGNUP Route
router.post('/signup', helper.signupValidation, async (req, res, next) => {

  try{

    const {username, password, admin} = req.body
    //Rounds to hash
    const rounds = 10
    //Create a hashed password using the number of rounds above
    const hashed = await bcrypt.hash(password, rounds)

    //Checks to see if the username being created already exists
    const username_exist = await User.findOne({ username })
    if (username_exist) {
      const error = new Error(`Username '${username}' is already taken. Please enter a another username.`)
      error.status = 400
      return next(error)
    }

    //Creates the user
    const user = await User.create({ username, password: hashed, admin })

    //Creates a jsonwebtoken to be returned to the user after signup
    const options = { expiresIn: '1 day' }
    const token = generateMyToken(user._id, user.admin)

    const status = 201
    const message = `You have successfully created an account.`
    res.status(status).json({ status, message, token })

  }catch(e){
    //Error Handler
    console.error(e)
    const err = new Error('You are not authorized to access this route.')
    err.status = 401
    next(err)
  }

}) //End of signup route



//LOGIN Route
router.post('/login', async (req, res, next) => {

  try{
    const {username, password} = req.body
    //Checks to see if the username exists in the database
    const user = await User.findOne({username})
    if(!user) throw new Error(`Username '${username}' could not be found.`)

    //Checks to see if the password matches the password in the database
    const isValid = await bcrypt.compare(password, user.password)
    if(!isValid) throw new Error(`Password is invalid`)

    //Call generateMyToken function passing in users id to get a returned token
    const token = generateMyToken(user._id, user.admin)

    const status = 201
    const message = `You have successfully logged in as '${user.username}'.`
    res.status(status).json({status, message, token, admin: user.admin})

  }catch(e){
    //Error Handler
    console.error(e)
    const err = new Error('Login credentials incorrect')
    err.status = 401
    next(err)
  }

})//End of login route



//Allow admins to change permission of other users.
router.patch('/users/:id/permissions', helper.userAdmins, async (req, res, next) => {

  const { id } = req.params

  try{
    const { admin } = req.body
    const user = await User.findById(id)

    if (!user) {
      const error = new Error(`No user found with _id: ${id}`)
      error.message = 404
      return next(error)
    }

    // Set the admin access to the current user
    user.admin = admin
    //Save the user object
    await user.save()

    const status = 204
    const message = `Successfully updated account admin info.`
    res.status(status).json({message})

  }catch(e){
    //Error Handler
    console.error(e)
    const err = new Error(`No user with _id: ${id} FOUND!`)
    err.status = 404
    next(err)
  }

})//End of user permissions route



module.exports = router
