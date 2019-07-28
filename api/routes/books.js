const router = require('express').Router()
const Book = require('../models/book')

const { SECRET_KEY } = process.env
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')

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
  const status = 200
  try {
    // Authorization first
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = jsonwebtoken.verify(token, SECRET_KEY)

    // Authentication
    const user = await User.findOne({ _id: payload.id })

    const isAdmin = user.admin

    // Error if not admin
    if (!isAdmin) throw new Error(`Access Denied: Must be Admin`)

    // If admin continue with book creation
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
router.patch('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  try {
    // Must be signed in
    if (!req.headers.authorization) throw new Error("must be signed in")

    // Verify token
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = jsonwebtoken.verify(token, SECRET_KEY)

    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    if (book.reserved.status == true) {
      const error = new Error(`Book _id: ${id} already reserved`)
      error.status = 400
      return next(error)
    }

    book.reserved.status = true
    // save user id in reserved object
    book.reserved.memberId = payload.id
    // Set the reserved memberId to the current user
    await book.save()

    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    const message = 'Bad request.'
    const error = new Error(message)
    error.status = 400
    next(error)
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {
  const status = 200

  try {
    // Must be signed in
    if (!req.headers.authorization) throw new Error("must be signed in")

    // Verify token
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    const id = req.params.id

    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    if (book.reserved.status == false ) {
      const error = new Error(`Book _id: ${id} is not reserved`)
      error.status = 400
      return next(error)
    }

    if (book.reserved.memberId != payload.id ) {
      const error = new Error(`Book _id: ${id} is not reserved by this member`)
      error.status = 401
      return next(error)
    }

    // clear reservation status
    book.reserved.status = false
    book.reserved.memberId = null

    // Set the reserved memberId to the current user
    await book.save()

    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    const message = 'Bad request.'
    const error = new Error(message)
    // error.status = 400
    next(error)
  }
})

module.exports = router