const router = require('express').Router()
const bcrypt = require('bcrypt');
const { sign, verify } = require('jsonwebtoken');
const User = require('../models/user')
const Book = require('../models/book')
const { SECRET_KEY } = process.env

router.use(async (req, res, next) => {
  try{
    delete req.user
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = verify(token, SECRET_KEY)
    const user = await User.findOne({ _id: payload.id }).select('-__v -password')
    if(user){
      req.user = user
    }
  }finally{
    next()
  }
})

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
  if(!req.user){
    const error = new Error(`Unauthorized.`)
    error.status = 401
    next(error)
  }
  const status = 200
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
})

// You should only be able to reserve a book if a user is logged in
router.patch('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  if(!req.user){
    const error = new Error(`Unauthorized.`)
    error.status = 401
    next(error)
  }
  try {
    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    if (book.reserved.status == true) {
      const error = new Error(`The book is already reserved`)
      error.status = 400
      return next(error)
    }

    book.reserved.status = true
    // Set the reserved memberId to the current user
    book.reserved.memberId = req.user._id
    await book.save()
    
    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    res.status(500).json({ status: 500, response: error.message })
  }
})

router.patch('/:id/return', async (req, res, next) => {
  const { id } = req.params
  if(!req.user){
    const error = new Error(`Unauthorized.`)
    error.status = 401
    next(error)
  }
  try {
    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    if (book.reserved.status == false) {
      const error = new Error(`The book is not reserved`)
      error.status = 400
      return next(error)
    }

    if(!book.reserved.memberId.equals(req.user._id)){
      const error = new Error(`The book is reserved by someone else.`)
      console.log(book.reserved.memberId == req.user._id)
      error.status = 401
      return next(error)
    }

    book.reserved.status = false
    // Set the reserved memberId to null
    book.reserved.memberId = null
    await book.save()
    
    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    res.status(500).json({ status: 500, response: error.message })
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {
  const status = 200
  const message = 'You must implement this route!'
  
  console.log(message)
  res.status(status).json({ status, message })
})

module.exports = router