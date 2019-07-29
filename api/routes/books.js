const router = require('express').Router()
const Book = require('../models/book')
const { SECRET_KEY } = process.env
const bcrypt = require('bcrypt')
const User = require('../models/user')
const { sign, verify } = require('jsonwebtoken')

router.get('/', async (req, res, next) => {
  const status = 200
  const response = await Book.find().select('-__v')

  res.json({ status, response })
})

router.get('/:id', async (req, res, next) => {
  const { id } = req.params
  const status = 200
  try {
    const response = await Book.findById(id).select('-__v')
    if (!response) throw new Error(`Invalid Book _id: ${id}`)

    res.json({ status, response })
  } catch (e) {
    console.error(e)
    const error = new Error(`Cannot find book with id ${id}.`)
    error.status = 404
    next(error)
  }
})

// You should only be able to create a book if the user is an admin
router.post('/', async (req, res, next) => {
  const token = req.headers.authorization.split('Bearer ')[1]
  const payload = verify(token, SECRET_KEY)
  const loggedInUser = await User.findOne({ _id: payload.id })
  let status = 200

  try {

    if (!loggedInUser.admin) {
      // requester is not an admin 401
      const error = new Error('You do not have admin authorizations')
      error.status = 401
      return next (error)
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

// You should only be able to reserve a book if a user is logged in
// Update the `POST /api/books/:id/reserve` route:** This route allows for someone to reserve a book. If the user is logged in, proceed as normal.
// You should return an error in the following cases:
// A valid JWT token is not provided (status 401)
// The book is already reserved (status 400)
// Book cannot be found (status 404)
router.patch('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  try {
    let status = 200

    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = verify(token, SECRET_KEY)
    const loggedInUser = await User.findOne({ _id: payload.id })


    const book = await Book.findById(id)

    //this works here
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    const bookStatus = book.reserved.status
    if(bookStatus){
      const error = new Error(`The book is already reserved`)
      error.status = 400

      return next(error)
    }

    book.reserved.status = true
    book.reserved.memberId = loggedInUser._id
    await book.save()

    const response = await Book.findById(book._id).select('-__v')

    res.json({ status, response })
  } catch (e) {
    console.error(e)
    if(e.name === 'JsonWebTokenError'){
      const e = new Error("Invalid Token")
      e.status = 401
      next(e)
    }
    e.staus = 404
    next(e)
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
//Create a `PATCH /api/books/:id/return` route:** This route should return a book if the user has already reserved it.
//If the appropriate user is returning the book, set the `reserved.status` to `false` and update the `reserved.memberId` to be `null`.
//You should return an error in the following cases:
//A valid JWT token is not provided (status 401)
//The book is reserved by a different user (status 401)
//The book is not reserved (status 400)
// Book cannot be found (status 404)
router.patch('/:id/return', async (req, res, next) => {
  try {
    //console.log(`I am the id ${id}`)
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = verify(token, SECRET_KEY)
    const loggedInUser = await User.findOne({ _id: payload.id })

    const book = await Book.findById(req.params.id)
    //this does not work here
    //if (!book) {
      //const error = new Error(`Invalid Book _id: ${id}`)
      //error.status = 404
      //return next(error)
    //}

    //works
    const bookStatus = book.reserved.status
    if(!bookStatus){
      const error = new Error(`This book is not reserved`)
      error.status = 400
      return next(error)
    }

    //
    const bookReservedBy = book.reserved.memberId
    //console.log(`Book Reserved  '${bookReservedBy}' type:${typeof bookReservedBy.constructor.name}`)
    //console.log(`Logged in User '${loggedInUser._id} type:${typeof loggedInUser._id}`)
    //console.log(`are not same ${String(bookReservedBy) !== String(loggedInUser._id)}`)
    //works
    if (String(bookReservedBy) !== String(loggedInUser._id)){
      const error = new Error(`You do not have this book reserved`)
      error.status = 401
      return next(error)
    }

    //works
    book.reserved.status = false
    book.reserved.memberId = null
    await book.save()

    //
    let status = 200
    const response = 'You sucessfully returned a book!'
    res.json({ status, response })

  } catch (e) {

    console.error(e)

    //works
    if(e.name === 'JsonWebTokenError'){
      const e = new Error("Invalid Token")
      e.status = 401
      next(e)
    }

    //works
    if(e.name === 'CastError'){
      const e = new Error("The Book Id is invalid")
      e.status = 400
      next(e)
    }

    //definitaly works
    console.log(`Error Name: ${e.name}`)
    e.status = 404
    next(e)
  }
})

module.exports = router