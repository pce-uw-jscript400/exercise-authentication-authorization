const User = require('../models/user');
const router = require('express').Router();
const { SECRET_KEY } = process.env;
var jsonwebtoken = require('jsonwebtoken');


//These values are hard-coded while the jwt isn't working for me
//TODO: remove these values and routes use the payload returned after verifying token

const jwtAdmin = {
    _id: '',
    admin: true
}

const jwtNonAdmin = {
    _id: '',
    admin: false
}


router.patch('/:id/permissions', async(req, res, next) => {
    
    try {
        const status = 201;
        //TODO: how to return a 401 here/how to return conditonal errors?
        if(!req.headers.authorization) throw new Error('Access denied');
        
        //check if the admin status is true
        // const token = req.headers.authorization.split('Bearer ')[1];
        // TODO: Get this working and replace hard-coded jwtAdmin/jwtNonAdmin with payload.admin
        // const payload = jsonwebtoken.verify(token, SECRET_KEY);

        const isAdmin = jwtAdmin.admin;
        // const isAdmin = jwtNonAdmin.admin;

        //TODO: make to use payload and have a 401 status
        if(!isAdmin) throw new Error('Access Denied');

        //TODO: make this return a 400 and better error message
        if(!req.body.hasOwnProperty('admin')) throw new Error('No Admin Information');

        //TODO: if no User found --> 404
        const user = await User.findById({ _id: req.params.id});

        user.admin = req.body.admin;
        user.save();
        
        res.json({ status, user });

    } catch(e) {
        console.error(e);   
        const error = new Error('There was a problem with permissions');
        error.status = 400;
        next(error);
    }
});

module.exports = router;
