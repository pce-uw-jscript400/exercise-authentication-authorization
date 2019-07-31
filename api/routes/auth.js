const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const { SECRET_KEY } = process.env;

  /***
 * - [ ] **Create a `POST /api/signup` route:** Create a new route that allows someone to create an account. Securely store the password using the `bcrypt` package. 
 * On successful creation, return a JWT token. You should return an error in the following cases:
  * Username is not provided
  * Username is already taken
  * Password is not provided
  * Password is less than 8 characters
 */

router.post('/signup', async (req, res, next) => {
  const status = 201;
  try {
    const {username, password} = req.body;
    if (!username) {
        throw new Error (`User name not provided. Please update your request and retry.`);
    }
    if (!password) {
        throw new Error (`Password not provided. Please update your request and retry.`);
    }
    if (password.length < 8) {
        throw new Error (`Password does not meet minimum length requirements. Please update your request and retry.`)
    }
    const user = await User.findOne({username});
    if (user) {
        throw new Error (`User ${username} already exists.`)
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({
        username,
        password: hashedPassword
    });   
    const payload = {username: newUser.username, password: newUser.password };
    const options = { expiresIn: '1 day' };
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options);
    res.status(201).json({ status, token});
  } catch (e) {
      console.error(e);
      const error = new Error(`An error has occurred. Please retry your request.`);
      error.status = 400;
      next(error);
  }
  
});

/**
 * 
 * - [ ] **Create a `POST /api/login` route:** Create a new route that allows someone to login. On successful creation, return a JWT token. You should return an error in the following cases:
  * Username is not found
  * Username and password do not match
 * 
 */

router.post('/login', async (req, res, next) => {
    const status = 201;
    try {
        const {username, password} = req.body;
        const user = await User.findOne({username});
        if (!user) {
            const error = new Error(`Username could not be found.`);
            error.message = 404;
            return next(error);
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            const error = new Error(`Password is invalid.`);
            error.message = 400;
            return next(error);
        }
        const payload = { id: user._id }
        const options = { expiresIn: '1 day' }
        const token = jsonwebtoken.sign(payload, SECRET_KEY, options)
        res.status(201).json({ status, token});
    } catch (e) {
        console.error(e);
        const error = new Error(`Please check your username and password and try again.`)
        error.status = 400;
        next(error);
    
    }
});

/**
 * 
 * - [ ] **Create a `PATCH /api/users/:id/permissions` route:** Create a new route that allows for an admin to change permissions of another user. 
 * The route should only be looking for the `admin: <boolean>` key in the request body and setting the value appropriately. On success, return a status 204. 
 * You should return an error in the following cases:
  * A valid JWT token is not provided (status 401)
  * The JWT token is for a user who is not an admin (status 401)
  * User cannot be found (status 404)
  * The request body does not include an `admin` key with a boolean value (status 400)

 * 
 */

router.patch('/users/:id/permissions', async (req, res, next) => {
    const { id } = req.params;
    try {
        const token = req.headers.authorization.split(`Bearer `)[1];
        const isValid = jsonwebtoken.verify(token, SECRET_KEY);
        if (!isValid) {
            throw new Error(`Token is not valid. Please check your request and try again.`);
            //error.message = 401;   I continously ran into failed requests until i commented this out and changed the above from `const error = new Error...` to the current statement. Any suggestion as to why this is? This prevents me from outputing the specific error codes as intended.
            //return next(error);
        }
        const { admin } = req.body;
        if (admin == null) {
            throw new Error(`Unable to authenticate as Admin. Please check your request and try again. `);
            //error.message = 401;
            //return next(error);
        }
        const isAdmin = await User.findOne({_id: isValid.id});
        if (isAdmin.admin == false) {
            throw new Error(`Ah ah ah, you didn't say the magic word! Please check your request and try again.`);
            // i could not get this error to throw successfully even when the user.admin = false. is something off with my if condition? I can't figure out why this isn't getting caught, and user is able to manage other users.
            //error.message = 401;
            //return next(error);
        }
        const user = await User.findById(id);
        if (!user) {
            throw new Error(`Username could not be found. Please check your request and try again.`);
            //error.message = 401;
            //return next(error);
        }
        const response =await User.findOneAndUpdate(
            {_id: id},
            {admin: admin},
            { new: true }
        ).select('-__v');
        const status = 204;
        res.json({ status, response });
    } catch (e) {
        console.error(e);
        const error = new Error(`Please check your username and password and try again.`)
        error.status = 400;
        next(error);
    
    }
});

module.exports = router

