const router = require("express").Router();
const Book = require("../models/book");
const Users = require("../models/user");
const { verify } = require("jsonwebtoken");
const { SECRET_KEY } = process.env;

router.get("/", async (req, res, next) => {
  const status = 200;
  const response = await Book.find().select("-__v");

  res.json({ status, response });
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  const status = 200;
  try {
    const response = await Book.findById(id).select("-__v");
    if (!response) throw new Error(`Invalid Book _id: ${id}`);

    res.json({ status, response });
  } catch (e) {
    console.error(e);
    const error = new Error(`Cannot find book with id ${id}.`);
    error.status = 404;
    next(error);
  }
});

// You should only be able to create a book if the user is an admin
router.post("/", async (req, res) => {
  const status = 200;
  let message;

  // Get the token from request header and verify
  const token = req.headers.authorization.split(" ")[1];
  const payload = verify(token, SECRET_KEY);
  //verify the logged in user is an admin - if invalid send 401
  const isValidAdmin = await Users.findOne({ _id: payload.id }).select("admin");
  if (!isValidAdmin.admin) {
    message = "You are not authorized to access this route";
    error = new Error(message);
    res.status(401).send({
      status: 401,
      message: message
    });
  } else {
    try {
      const book = await Book.create(req.body);
      if (!book)
        throw new Error(`Request body failed: ${JSON.stringify(req.body)}`);
      const response = await Book.findById(book._id).select("-__v");
      res.json({ status, response });
    } catch (e) {
      message = "Failure to create. Please check request body and try again.";
      error = new Error(message);
      res.status(400).send({
        status: 400,
        message: message
      });
    }
  }
});

// You should only be able to reserve a book if a user is logged in
router.patch("/:id/reserve", async (req, res, next) => {
  const { id } = req.params.id;
  try {
    // Get the token from request header and verify
    let payload;
    const token = req.headers.authorization.split("Bearer ")[1];
    verify(token, SECRET_KEY, function(err, decoded) {
      payload = decoded;
      if (err) {
        const error = new Error(err);
        error.status = 401;
        error.message = `Invalid JWT token`;
        return next(error);
      }
    });
    //search for book - not found send 404 status
    const book = await Book.findById(req.params.id);
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`);
      error.status = 404;
      return next(error);
    }
    const bookStatus = await book.reserved.status;
    if (bookStatus) {
      const error = new Error(`This book is already reserved!`);
      error.status = 400;
      return next(error);
    }
    book.reserved.status = true;
    // Set the reserved memberId to the current user
    book.reserved.memberId = payload.id;
    await book.save();

    const response = await Book.findById(book._id).select("-__v");
    const status = 200;
    res.json({ status, response });
  } catch (e) {
    console.error(e);
  }
});

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch("/:id/return", async (req, res, next) => {
  const status = 200;
  try {
    // Get the token from request header and verify if valid token
    let payload;
    const token = req.headers.authorization.split("Bearer ")[1];
    verify(token, SECRET_KEY, function(err, decoded) {
      payload = decoded;
      if (err) {
        const error = new Error(err);
        error.status = 401;
        error.message = `Invalid JWT token`;
        return next(error);
      }
    });

    //get the book
    const book = await Book.findById(req.params.id);

    //check if bookstatus is reserved - else return 400
    const bookStatus = await book.reserved.status;
    if (bookStatus != true) {
      const error = new Error(`This book is not reserved!`);
      error.status = 400;
      return next(error);
    }
    //check if the returning user has reserved the book - else return 401
    const reserver = await book.reserved.memberId;
    if (reserver != payload.id) {
      const error = new Error(`This book is reserved by a different user!`);
      error.status = 401;
      return next(error);
    }
    //return the book - status equals false, member id equals null
    book.reserved.status = false;
    book.reserved.memberId = null;
    await book.save();

    const response = await Book.findById(book._id).select("-__v");
    res.status(status).json({ status, response });
  } catch (e) {
    console.error(e);
  }
});

module.exports = router;
