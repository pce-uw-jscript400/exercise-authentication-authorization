const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

const { SECRET_KEY } = process.env;




module.exports = router