const router = require('express').Router()
const Book = require('../models/book')
const User = require('../models/user');
const jsonwebtoken = require('jsonwebtoken');

const { SECRET_KEY } = process.env;

router.get('/', async (req, res, next) => {
  const status = 200;
  const response = await Book.find().select('-__v');
  res.json({ status, response });
})

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const status = 200
  try {
    const response = await Book.findById(id).select('-__v');
    if (!response) throw new Error(`Invalid Book _id: ${id}`);
    res.json({ status, response });
  } catch (e) {
    console.error(e);
    const error = new Error(`Cannot find book with id ${id}.`);
    error.status = 404;
    next(error);
  }
})

/***
 * - [ ] **Update the `POST /api/books` route:** This route should only be available to users who are admins. 
 * If the user is an admin, proceed as normal. If they are not an admin, return an error message with a status code of 401.
 */

router.post('/', async (req, res, next) => {
  const status = 200;
  try {
    const token = req.headers.authorization.split(`Bearer `)[1];
    const isValid = jsonwebtoken.verify(token, SECRET_KEY);
    if (!isValid) {
        throw new Error(`Token is not valid. Please check your request and try again.`);
        //error.message = 401;   I continously ran into failed requests until i commented this out and changed the above from `const error = new Error...` to the current statement. Any suggestion as to why this is?
        //return next(error);
    }
    const isAdmin = await User.findOne({_id: isValid.id});
    if (isAdmin.admin = false) {
        throw new Error(`Ah ah ah, you didn't say the magic word! Please check your request and try again.`);
        // i could not get this error to throw successfully even when the user.admin = false. is something off with my if condition? I can't figure out why this isn't getting caught, and books continue to get created.
        //error.message = 401;
        //return next(error);
    }
    const book = await Book.create(req.body)
    if (!book) throw new Error(`Request body failed: ${JSON.stringify(req.body)}`)
    const response = await Book.findById(book._id).select('-__v')
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    const message = 'Failure to create. Please check request body and try again.'
    const error = new Error(message)
    error.status = 400
    next(error)
  }
})

/**
 * - [ ] **Update the `POST /api/books/:id/reserve` route:** This route allows for someone to reserve a book. If the user is logged in, proceed as normal. You should return an error in the following cases:
  * A valid JWT token is not provided (status 401)
  * The book is already reserved (status 400)
  * Book cannot be found (status 404)
 */

router.patch('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  try {
    // validate token, identify user, identify book
    const token = req.headers.authorization.split(`Bearer `)[1];
    const isValid = jsonwebtoken.verify(token, SECRET_KEY);
    const user = await User.findOne({ _id: isValid.id });
    if (!isValid) {
      const error = new Error(`Token is not valid. Please check your request and try again.`);
      error.status = 401;
      return next(error);
    }
    const book = await Book.findById(id) // book id derived from req.params
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`);
      error.status = 404;
      return next(error);
    }
    if (book.reserved.status === true) {
      const error = new Error(`This book has already been reserved.`);
      error.status = 400;
      return next(error);
    }
    book.reserved.status = true; // reserve book
    book.reserved.memberId = user._id // set reserve member ID as user 
    await book.save()
    
    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
  }
})

/***
 * - [ ] **Create a `PATCH /api/books/:id/return` route:** This route should return a book if the user has already reserved it. If the appropriate user is returning the book, set the `reserved.status` to `false` and update the `reserved.memberId` to be `null`. You should return an error in the following cases:
  * A valid JWT token is not provided (status 401)
  * The book is reserved by a different user (status 401)
  * The book is not reserved (status 400)
  * Book cannot be found (status 404)
 */

router.patch('/:id/return', async (req, res, next) => {
  const { id } = req.params
  try {
    const token = req.headers.authorization.split(`Bearer `)[1];
    const isValid = jsonwebtoken.verify(token, SECRET_KEY);
    const user = await User.findOne({ _id: isValid.id });
    console.log(user);
    if (!isValid) {
      const error =new Error(`Token is not valid. Please check your request and try again.`);
      error.status = 401;
      return next(error);
    }
    const book = await Book.findById(id);
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`);
      error.status = 404;
      return next(error);
    }
    if (book.reserved.status === false) {
      const error = new Error(`This book has not yet been reserved.`);
      error.status = 400;
      return next(error);
    }
    if (book.reserved.memberId !== user._id) {
      const error = new Error(`This book is reserved by another user.`);
      error.status = 400;
      return next(error);
    }
    book.reserved.status = false;
    book.reserved.memberId = "";
    await book.save();
    const response = await Book.findById(book._id).select('-__v');
    const status = 200;
    res.json({ status, response });
  } catch (e) {
    console.error(e);
  }
})

module.exports = router