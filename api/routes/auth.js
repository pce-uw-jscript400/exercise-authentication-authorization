const { SECRET_KEY } = process.env;
var jsonwebtoken = require('jsonwebtoken');
const router = require('express').Router();
const User = require('../models/user');
const bcrypt = require('bcrypt');


router.post('/signup', async(req, res, next) => {
    const status = 201;

    try {
        const { username, password } = req.body;
        const exisitingUser = await User.findOne({ username });

        if(exisitingUser) throw new Error(`This username ${username} is already in use`);

        if(password.length > 7 || password.length === 0) {
            throw new Error(`Password must be at least 1 character and less than 8`);
        }

        const saltRounds = 10;
        const hashedPwd = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            username, 
            password: hashedPwd
        })

        //TODO: add the JWT stuff here
        const payload = { id: user._id }
        const options = { expiresIn: '1 day' }
        const token = jsonwebtoken.sign(payload, 'SECRET_KEY', options)

        res.json({ status, token});
    } catch(e) {
        console.error(e);   
        const error = new Error('Error in signing up');
        error.status = 400;
        next(error);
    }
});

router.post('/login', async(req, res, next) => {

    const status = 201;
    
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) throw new Error(`There was a problem logging in`);

        const isPwdValid = await bcrypt.compare(password, user.password);
        if(!isPwdValid) throw new Error(`There was a problem logging in `);

        res.json({ status, user });

    } catch(e) {
        console.error(e);
        const error = new Error(`Login credentials are incorrect`);
        error.status = 400;
        next(error);
    }
});

module.exports = router;
