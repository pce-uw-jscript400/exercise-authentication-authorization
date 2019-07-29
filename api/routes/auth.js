const router = require("express").Router();
const Users = require("../models/user");
const bcrypt = require("bcrypt");
const { sign, verify } = require("jsonwebtoken");

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
    user = await Users.create({
      username,
      password: hashedPassword,
      admin: req.body.admin
    });
    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = sign(payload, SECRET_KEY, options);
    res.status(status).json({ status, token });
  } catch (error) {
    console.error(error);
    const e = new Error("Enter a valid username and password");
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
    if (!isValid) throw new Error("Username and password do not match");
    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = sign(payload, SECRET_KEY, options);
    res.status(status).json({ status, token });
  } catch (error) {
    console.error(error);
    error = new Error(`An error occurred while login`);
    error.status = 400;
    next(error);
  }
});

router.patch("/users/:id/permissions", async (req, res, next) => {
  let status = 204;

  try {
    //get JWT and validate
    const token = req.headers.authorization.split("Bearer ")[1];
    let payload;
    verify(token, SECRET_KEY, function(err, decoded) {
      payload = decoded;
      if (err) {
        const error = new Error(err);
        error.status = 401;
        error.message = `Invalid JWT token`;
        return next(error);
      }
    });
    //verify the logged in user is an admin - if invalid send 401
    const isValidAdmin = await Users.findOne({ _id: payload.id }).select(
      "admin"
    );
    if (isValidAdmin != true) {
      const error = new Error("You are not authorized to access this route");
      error.status = 401;
      return next(error);
    }
    //check if the req body has admin key - else send 400
    if (!req.body.admin) {
      const error = new Error("Please send a value to update the record");
      error.status = 400;
      return next(error);
    }
    //edit user is not found - throw an error
    let user = await Users.findById(req.params.id);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    } else {
      user.admin = req.body.admin;
      response = await user.save();
      res.status(status).json({ status, response });
    }
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
