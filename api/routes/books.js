const router = require('express').Router()
const Book = require('../models/book')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const { SECRET_KEY } = process.env

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
    // const token = req.headers.authorization.split('Bearer ')[1]
    //   const secret = new Buffer.alloc(SECRET_KEY, "base64")
    // const payload = jwt.verify(token, SECRET_KEY)
    // const user = await Users.findOne({ _id: payload.id }).select('-__v -password')
    // const isAdmin = (user.admin === true)
    // const adminStatus = 404
    // if(!isAdmin) throw new Error(`You do not have access ${adminStatus}`)

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
    const token = req.headers.authorization.split('Bearer ')[1]
    // const secret = new Buffer.alloc(SECRET_KEY, "base64")
    const payload = jwt.verify(token, SECRET_KEY)
    const user = await Users.findOne({ _id: payload.id }).select('-__v -password')

    if(!user) {
      const error = new Error(`You do not have access`)
      error.message = 401
      return next(error)
    } 

    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Book cannot be found`)
      error.message = 404
      return next(error)
    }

    if (book.reserved.status === true){
      const error = new Error(`Book is already reserved`)
      error.message = 401
      return next(error)
    }


    book.reserved.status = true
    book.reserved.memberID = user.id
    // Set the reserved memberId to the current user
    await book.save()
    
    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {
  const token = req.headers.authorization.split('Bearer ')[1]
  // const secret = new Buffer.alloc(SECRET_KEY, "base64")
  const payload = jwt.verify(token, SECRET_KEY)
  const user = await Users.findOne({ _id: payload.id }).select('-__v -password')

  const book = await Book.findById(id)

   
  console.log(message)
  res.status(status).json({ status, message })
})

module.exports = router