const { SECRET_KEY } = process.env
const router = require('express').Router()
const Book = require('../models/book')
const User = require('../models/user')
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
// Nested try/catch here
router.post('/', async (req, res, next) => {
  const status = 200
  const { authorization } = req.headers
  try {
    if (!authorization) throw new Error (`You are not authorized!`)
    const token = authorization.split('Bearer ')[1]
    //make sure token exists
    if (!token) throw new Error (`You are not authorized`)
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    const user = await User.findOne({ _id: payload.id }).select('-__v -password')
    if (!user || user.admin !== true) throw new Error (`You are not authorized`)

    try {
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

  } catch (e) {
    e.status = 401
    next(e)
  }
})

// You should only be able to reserve a book if a user is logged in
router.post('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  const status = 200
  const { authorization } = req.headers
  //make sure token exists
  if (! authorization) {
    const error = new Error (`You are not authorized`)
    error.status = 401
    return next(error)
  }
  try {
    const token = authorization.split('Bearer ')[1]
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    const user = await User.findById(payload.id)

    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    } else if (book.reserved.status === true) {
      const error = new Error(`Book _id: ${id} is already reserved`)
      error.status = 400
      return next(error)
    }

    book.reserved.status = true
    // Set the reserved memberId to the current user
    book.reserved.memberId = user._id
    await book.save()
    
    const response = await Book.findById(book._id).select('-__v')
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    e.status = 401
    next(e)
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {
  const status = 204
  const { id } = req.params

  try {
    const token = req.headers.authorization.split('Bearer ')[1]
    if (!token) {
      const error = new Error (`You are not authorized`)
      error.status = 401
      return next(error)
    }
    //try/catch this?
    const payload = await jsonwebtoken.verify(token, SECRET_KEY)
    const book = await Book.findById(id)
    if (!book) {
      const error = new Error (`Book _id: ${id} not found`)
      error.status = 404
      return next(error)
    } else if (book.reserved.memberId != payload.id) {
      //not deep equal because string/object comparison
      const error = new Error (`A different user reserved this book`)
      error.status = 401
      return next(error)
    } else if (book.reserved.status !== true) {
      const error = new Error(`This book is not reserved!`)
      error.status = 400
      return next(error)
    }

    book.reserved.status = false
    book.reserved.memberId = null
    
    await book.save()

    const response = await Book.findById(book._id).select('-__v')

    res.status(status).json({status,response})

  } catch (e) {
    console.error(e)
    next (e)
  }
})

module.exports = router