const router = require('express').Router()
const Book = require('../models/book')
const User = require('../models/user')
const {
  sign,
  verify
} = require('jsonwebtoken')

const {
  SECRET_KEY
} = process.env

router.get('/', async (req, res, next) => {
  const status = 200
  const response = await Book.find().select('-__v')

  res.json({
    status,
    response
  })
})

router.get('/:id', async (req, res, next) => {
  const {
    id
  } = req.params
  const status = 200
  try {
    const response = await Book.findById(id).select('-__v')
    if (!response) throw new Error(`Invalid Book _id: ${id}`)

    res.json({
      status,
      response
    })
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
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = verify(token, SECRET_KEY)

    if (!payload) {
      const error = new Error(`A valid JWT token is not provided.`)
      error.status = 401
      next(error)
    }
    const checkAdmin = await User.findOne({
      _id: payload.id
    })
    if (!checkAdmin.admin) {
      const error = new Error(`The JWT token is for a user who is not an admin.`)
      error.status = 401
      next(error)
    }
    if (!book) throw new Error(`Request body failed: ${JSON.stringify(req.body)}`)
    if (token && checkAdmin.admin) {
      const book = await Book.create(req.body)
    }
    const response = await Book.findById(book._id).select('-__v')
    res.json({
      status,
      response
    })
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
  const {
    id
  } = req.params
  try {
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = verify(token, SECRET_KEY)

    if (!payload) {
      const error = new Error(`A valid JWT token is not provided.`)
      error.status = 401
      next(error)
    }

    const book = await Book.findById(id)

    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    if (book.reserved.status) {
      const error = new Error(`THe book is already reserved`)
      error.status = 400
      return next(error)
    }

    book.reserved.status = true
    book.reserved.memberId = payload.id
    await book.save()

    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({
      status,
      response
    })
  } catch (e) {
    const error = e
    error.status = 400
    return next(e)
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {
  const {
    id
  } = req.params
  try {
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = verify(token, SECRET_KEY)

    if (!payload) {
      const error = new Error(`A valid JWT token is not provided.`)
      error.status = 401
      return next(error)
    }

    const book = await Book.findById(id)

    if (!book) {
      const error = new Error(`Book cannot be found.`)
      error.status = 404
      return next(error)
    }

    if (book.reserved.memberId != payload.id) {
      const error = new Error(`The book is reserved by a different user.`)
      error.status = 401
      return next(error)
    }

    if (!book.reserved.status) {
      const error = new Error(`The book is not reserved`)
      error.status = 400
      return next(error)
    }

    book.reserved.status = false
    book.reserved.memberId = null
    await book.save()

    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    const message = 'Book has been returned!'
    console.log(message)
    res.status(status).json({
      status,
      message,
      response
    })
  } catch (e) {
    const error = e
    error.status = 400
    next(e)
  }
})

module.exports = router