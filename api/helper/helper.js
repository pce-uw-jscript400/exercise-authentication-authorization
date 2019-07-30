const REQUIRED_KEYS = [ 'username', 'password' ]
const { SECRET } = process.env
const jwt = require('jsonwebtoken')

//Middleware for validating account signup
const signupValidation = (req, res, next) => {
  const {username, password, admin} = req.body

  //Checks to see all required fields are provided
  if (!req.body) next({ status: 401, message: 'Missing request POST body!' })

  //Checks to see if username is empty
  if(!username) next({ status: 400, message: 'Please enter a username!' })

  //Checks to see if password is provided
  if(!password){
    next({ status: 400, message: 'Please enter a password!' })
  }else{
    //If password is provided validate for its length, error out if less then minimum of 8 characters
    if(password.length < 8) next({ status: 400, message: 'Invalid password length. Please enter at least 8 characters.' })
  }

  next()
}

//This is the middleware to only allow admin users to change user permissions
const userAdmins = (req, res, next) => {
  const {admin} = req.body
  //Check to see if req body has the admin key and boolean value
  if(!req.body) next({ status: 400, message: 'Request body does not include an admin key!' })
  if(admin !== false && admin !== true) next({ status: 400, message: 'The request body does not include an admin key with a boolean value!' })

  //Check to see if there is a auth bearer attached to the request
  if(!req.headers.authorization) next({ status: 401, message: 'A valid JWT token is not provided' })
  const token = req.headers.authorization.split('Bearer ')[1]

  //Verify that the token is a valid token
  const payload = jwt.verify(token, SECRET)
  console.log(payload.admin)
  //Checks if the logged in user token is an admin
  if(payload.admin === false) next({status:401, message: 'The JWT token is for a user who is not an admin'})

  next()

}


//This is the middleware for the book creation route to prevent non-admins from posting
const bookAdmins = (req, res, next) => {
  //Check to see if there is a auth bearer attached to the request
  if(!req.headers.authorization) next({ status: 401, message: 'A valid JWT token is not provided' })
  const token = req.headers.authorization.split('Bearer ')[1]

  //Verify that the token is a valid token
  const payload = jwt.verify(token, SECRET)
  console.log(payload.admin)
  //Checks if the logged in user token is an admin
  if(payload.admin === false) next({status:401, message: 'You are not an ADMIN, you CANNOT access this route.'})

  next()
}



//This is the middleware for the book reserve route
const reserver = (req, res, next) => {
  //Check to see if there is a auth bearer attached to the request
  if(!req.headers.authorization) next({ status: 401, message: 'A valid JWT token is not provided.' })
  const token = req.headers.authorization.split('Bearer ')[1]

  //Verify that the token is a valid token
  const payload = jwt.verify(token, SECRET)

  //Set userId to logged in users id so that I can use it in the route to set the reserved memberId to this.
  req.userId = payload.id
  if(!payload) next({status: 401, message: 'You are not allowed to RESERVE a book.'})

  next()
}


//This is the middleware for the book return route
const returner = (req, res, next) => {
  //Check to see if there is a auth bearer attached to the request
  if(!req.headers.authorization) next({ status: 401, message: 'A valid JWT token is not provided.' })
  const token = req.headers.authorization.split('Bearer ')[1]

  //Verify that the token is a valid token
  const payload = jwt.verify(token, SECRET)

  //Set userId to logged in users id so that I can use it in the route to set the reserved memberId to this.
  req.userId = payload.id
  if(!payload) next({status: 401, message: 'You are not allowed to RETURN this book.'})

  next()
}



module.exports = { signupValidation, userAdmins, bookAdmins, reserver, returner }
