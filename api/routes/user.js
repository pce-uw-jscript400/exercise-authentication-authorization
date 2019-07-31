const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/check-auth");
const User = require("../models/user");

router.post("/signup", (req, res, next) => {
  if (req.body.username) {
    User.find({ username: req.body.username })
      .exec()
      .then(user => {
        if (user.length >= 1) {
          return res.status(409).json({
            message: "Username is already taken"
          });
        } else {
          if (req.body.password) {
            if (req.body.password.length >= 8) {
              bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                  return res.status(500).json({
                    error: err
                  });
                } else {
                  const user = new User({
                    _id: new mongoose.Types.ObjectId(),
                    username: req.body.username,
                    password: hash
                  });
                  user
                    .save()
                    .then(result => {
                      console.log(result);
                      res.status(201).json({
                        message: "User created"
                      });
                    })
                    .catch(err => {
                      console.log(err);
                      res.status(500).json({
                        error: err
                      });
                    });
                }
              });
            } else {
              return res.status(409).json({
                message: "Password is less than 8 characters"
              });
            }
          } else {
            return res.status(409).json({
              message: "Password is not provided"
            });
          }
        }
      });
  } else {
    return res.status(409).json({
      message: "Username is not provided"
    });
  }
  ///
});
/********************************************************* */
router.post("/login", (req, res, next) => {
  User.find({ username: req.body.username })
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Username is not found"
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Username and password do not match"
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              username: user[0].username,
              userId: user[0]._id
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1h"
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token
          });
        }
        res.status(401).json({
          message: "somthing went wrong"
        });
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});
/*************************************************** */
router.patch("/users/:id/permissions", checkAuth, async (req, res, next) => {
  User.findById(req.params.id)
    .exec()
    .then(order => {
      if (order) {
        if (!order.admin) {
          return res.status(401).json({
            message: "The JWT token is for a user who is not an admin"
          });
        }
        res.status(204).json({
          message: "User has been updated"
        });
      } else {
        res.status(404).json({
          message: "User cannot be found"
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
});

module.exports = router;
