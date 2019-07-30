const router = require("express").Router();
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const User = require("../models/user");
const { SECRET_PW } = process.env;

router.post("/signup", async (req, res, next) => {
  const status = 201;
  try {
    const { username, password, admin } = req.body;
    const user = await User.findOne({ username });
    if (user) throw new Error(`User ${username} already exists.`);

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const response = await User.create({
      username,
      password: hashedPassword,
      admin
    });
    res.status(status).json({ status, response });
  } catch (error) {
    console.log(error);
    const e = new Error(`User ${username} already exists.`);
    e.status = 400;
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  const status = 201;
  try {
    const { username, password } = req.body;
    const checkForUser = await User.findOne({
      username
    });
    if (!checkForUser) throw new Error(`User ${username} does not exist.`);

    const user = await bcrypt.compare(password, checkForUser.password);
    if (!user) throw new Error(`Password is invalid.`);

    const payload = { id: user._id };
    const options = { expiresIn: "1 day" };
    const token = jsonwebtoken.sign(payload, "SECRET_PW", options);

    // res.status(status).json({ status, response: `You have been logged in.` });
    res.status(status).json({ status, token });
  } catch (error) {
    console.log(error);
    const e = new Error("Login credentials incorrect.");
    e.status = 401;
    next(e);
  }
});

// Admin should be able to change permissions for other users
// NOTE: Can't get this working...come back to it.
// router.patch("/users/:id/permissions", async (req, res, next) => {
//   const { id } = req.params;

//   try {
//     const token = req.headers.authorization.split("Bearer ")[1];
//     const payload = jsonwebtoken.verify(token, SECRET_PW);
//     const user = await User.findOne({ _id: payload.id }).select(
//       "-__v -password"
//     );
//     const isAdminUser = user.admin;

//     if (!isAdminUser) {
//       const error = new Error(
//         "The JWT token is for a user who is not an admin."
//       );
//       error.message = 401;
//       return next(error);
//     }

//     if (!user) {
//       const error = new Error("User cannot be found.");
//       error.message = 404;
//       return next(error);
//     }

//     const response = await User.findByIdAndUpdate(
//       id,
//       { admin: req.body.admin },
//       { new: true }
//     );
//     const status = 204;
//     res.json({ status, response });
//   } catch (e) {
//     console.error(e);
//   }
// });

router.patch("/users/:id/permissions", async (req, res, next) => {
  try {
    const token = req.headers.authorization.split("Bearer ")[1];
    const payload = jsonwebtoken.verify(token, SECRET_PW);
    const user = await User.findOne({ _id: payload.id }).select(
      "-__v -password"
    );
    const isAdminUser = user.admin;

    if (!isAdminUser) {
      const error = new Error(
        "The JWT token is for a user who is not an admin."
      );
      error.message = 401;
      return next(error);
    }

    if (!user) {
      const error = new Error("User cannot be found.");
      error.message = 404;
      return next(error);
    }

    const AdminStatus = user.admin;
    if (AdminStatus === true) {
      user.admin = false;
    } else {
      user.admin = true;
    }

    // Update the user permissions for the current user
    await user.save();

    const response = await User.findById(user._id).select("-__v");
    const status = 204;
    res.json({ status, response });
  } catch (e) {
    console.error(e);
  }
});

module.exports = router;
