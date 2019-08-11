const router = require("express").Router();
const User = require('../models/user')
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const { SECRET_KEY } = process.env;

// Starting route 
// http://localhost:5000/api/users

// GET
// http://localhost:5000/api/users


router.get('/', async (req, res, next) => { 
    const status = 200
    const response = await User.find().select('-__v -password')
    res.json({ status, response })  
})



module.exports = router;