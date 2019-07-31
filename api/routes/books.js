const router = require("express").Router();
const Book = require("../models/book");
const checkAuth = require("../middleware/check-auth");

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

router.post("/", async (req, res, next) => {
  const token = req.headers.authorization.split("Bearer ")[1];
  const payload = verify(token, SECRET_KEY);
  const adminUser = await User.findOne({ _id: payload.id });
  const status = 200;
  if (!adminUser.admin) {
    return res.status(401).json({
      message: "Not an admin user"
    });
  } else {
    try {
      const book = await Book.create(req.body);
      if (!book)
        throw new Error(`Request body failed: ${JSON.stringify(req.body)}`);

      const response = await Book.findById(book._id).select("-__v");
      res.json({ status, response });
    } catch (e) {
      console.error(e);
      const message =
        "Failure to create. Please check request body and try again.";
      const error = new Error(message);
      error.status = 400;
      next(error);
    }
  }
});

// You should only be able to reserve a book if a user is logged in
// checkAuth does chek the logged in member
router.patch("/:id/reserve", checkAuth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const book = await Book.findById(id);
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`);
      error.message = 404;
      return next(error);
    }

    book.reserved.status = true;
    // Set the reserved memberId to the current user
    book.reserved.memberId = req.userData;
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
router.patch("/:id/return", checkAuth, async (req, res, next) => {
  const status = 200;
  const message = "You must implement this route!";

  console.log(message);
  res.status(status).json({ status, message });
});

module.exports = router;
