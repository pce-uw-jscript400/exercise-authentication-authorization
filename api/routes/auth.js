const router = require("express").Router();
const Users = require("../models/user");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");

const { SECRET_KEY } = process.env;

//Creates an account - validate username and password, return JWT
router.post("/signup", async (req, res, next) => {
  const status = 201;

  try {
    const { username, password } = req.body;
    //Check for existing user
    let user = await Users.findOne({ username });
    if (user) throw new Error(`User ${username} already exists`);
    //Check for password min length
    if (req.body.password.length < 8)
      throw new Error("Password must be atleast 8 characters long!");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    user = await Users.create({ username, password: hashedPassword });
    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options);
    res.status(status).json({ status, token });
  } catch (error) {
    console.error(error);
    const e = new Error("Enter a valid username or password");
    e.status = 400;
    next(e);
  }
});

//Login user - validates user and username-password match
router.post("/login", async (req, res, next) => {
  const status = 201;
  try {
    const { username, password } = req.body;

    let user = await Users.findOne({ username });
    if (!user) throw new Error(`User ${username} not found`);
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error("Invalid password");

    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = jsonwebtoken.sign(payload, SECRET_KEY, options);
    res.status(status).json({ status, token });
  } catch (error) {
    console.error(error);
    error = new Error(`An error occurred while login`);
    error.status = 400;
    next(error);
  }
});

module.exports = router;
