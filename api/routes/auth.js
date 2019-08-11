const router = require("express").Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwot = require("jsonwebtoken");
const { SECRET_KEY } = process.env;

// Starting route
// http://localhost:5000/api/

// GET
// http://localhost:5000/api/users

router.get("/users", async (req, res, next) => {
  const status = 200;
  const response = await User.find().select("-__v -password");
  res.json({ status, response });
});

// POST
// http://localhost:5000/api/signup
// username & password in the body

router.post("/signup", async (req, res, next) => {
  const status = 201;
  try {
    //get username and password, make sure both are provided
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password)
      throw new Error(`Please enter a valid username and password`);
    if (password.length < 8) throw new Error(`Please create stronger password`);

    //make sure username already exists
    let user = await User.findOne({ username });
    if (user) throw new Error(`User ${username} already exists.`);

    //hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userInformation = await User.create({
      username,
      password: hashedPassword
    });

    //reassign user, this time find the one you just created
    user = await User.findOne({ username });

    //JWOT
    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = jwot.sign(payload, SECRET_KEY, options);

    const response = token;

    res.json({ status, response });
  } catch (e) {
    console.error(e);
    const error = e;
    error.status = 400;
    next(error);
  }
});

//POST
// http://localhost:5000/api/login

router.post("/login", async (req, res, next) => {
  const status = 200;
  try {
    //get username and password, make sure both are provided
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password)
      throw new Error(`Please enter a valid username and password`);
    //username lookup
    const user = await User.findOne({ username });
    if (!user) throw new Error(`Account could not be found`);

    //check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error(`Please enter a valid username and password`);
    
    //JWOT
    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = jwot.sign(payload, SECRET_KEY, options);    
      
    const response = token;
    res.json({ status, response });
      
  } catch (e) {
    console.error(e);
    const error = e;
    error.status = 400;
    next(error);
  }
});

module.exports = router;
