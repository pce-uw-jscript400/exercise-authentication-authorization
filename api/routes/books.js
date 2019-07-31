const router = require('express').Router()
const Book = require('../models/book')
const User = require('../models/user')
const jsonwebtoken = require('jsonwebtoken');

const {SECRET_KEY} = process.env

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

    // Check if the user is an admin
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    const user = await User.findOne({ _id: payload.id }).select('-__v -password')
    if(!user)
    {
      const error = new Error('Cannot find user')
      error.status = 404
      return next(error)
    }
    if(!(user.admin))
    {
      const error = new Error('User not an admin')
      error.status = 404
      return next(error)
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
router.patch('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  var status;
  try {
    // Check if its valid user/token
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    const user = await User.findOne({ _id: payload.id }).select('-__v -password')
    if(!user)
    {
      const error = new Error('Cannot find user')
      error.status = 404
      return next(error)
    }

    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.message = 404
      return next(error)
    }

    if (book.reserved.status === true)
    {
      const error = new Error('Book already reserved')
      error.message = 400
      return next(error)
    }

    book.reserved.status = true
    // Set the reserved memberId to the current user
    book.reserved.memberId = user._id
    await book.save()

    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    const message = 'Failed to set the reservation'
    const error = new Error(message)
    error.status = status
    next(error)
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {

  try{
  // Check if its valid user/token
  const token = req.headers.authorization.split('Bearer ')[1]
  const payload = jsonwebtoken.verify(token, SECRET_KEY)
  const user = await User.findOne({ _id: payload.id }).select('-__v -password')
  if(!user)
  {
    const error = new Error('Cannot find user')
    error.status = 404
    return next(error)
  }

  // Find the book
  const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }
  if(book.reserved.status === false)
  {
    const error = new Error('You cannot return an unreserved book')
    error.status = 400
    return next(error)
  }
  if(book.reserved.memberId != user._id)
  {
    const error = new Error('The user id does not match')
    error.status = 401
    return next(error)
  }

  /// If able to return successfully, set reserved status to false and clear the memberId
  book.reserved.status = false
  book.reserved.memberId = ""
  await book.save()

  const response = await Book.findById(book._id).select('-__v')
  const status = 200
  res.json({ status, response })

  res.status(status).json({ status, response })
}
catch (e) {
  console.error(e)
  const message = 'Failed to set the reservation'
  const error = new Error(message)
  error.status = status
  next(error)
}
})

module.exports = router