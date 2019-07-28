const router = require('express').Router()
const Book = require('../models/book')
const jwt = require('jsonwebtoken')
const Users = require('../models/users')

const { SECRET_KEY } = process.env

// get all books
router.get('/', async (req, res, next) => {
  const status = 200
  const response = await Book.find().select('-__v')
  
  res.json({ status, response })
})

// get book by ID
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
  console.log(req.body)
  try {
    // get token
    const token = req.headers.authorization.split('Bearer ')[1]
    // verify the token
    const payload = jwt.verify(token, SECRET_KEY)

    // get the current user's admin permissions
    const checkAdmin = await Users.findOne({ _id: payload.id }).select('admin')
    // if the user is not an admin, throw error
    if (checkAdmin.admin === false) {
        const error = new Error("You can't do this. You're not an admin!")
        error.status = 401
        return next(error)
    }
  
    // create the book from the request
    const book = await Book.create(req.body)
    // if there's something wrong with the request body, throw error
    if (!book) throw new Error(`Request body failed: ${JSON.stringify(req.body)}`)
    
    // find the newly created book and return it
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
    // get token
    const token = req.headers.authorization.split('Bearer ')[1]
    // verify token
    const payload = jwt.verify(token, SECRET_KEY)
    // check if the token is valid. if it's not, throw an error
    if (!payload) {
        const error = new Error('Invalid token.')
        error.status = 404
        return next(error)
    }

    // find the book by ID
    const book = await Book.findById(id)
    // if can't find the book, throw an error
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    // get the book's reserved status
    const bookStatus = await book.reserved.status
    // if the book is already reserved, throw error
    if (bookStatus === true) {
      const error = new Error(`Book is already reserved!`)
      error.status = 400
      return next(error)
    }

    // set the book's reserved status to true, set the memberID to the current user ID and save the book
    book.reserved.status = true
    book.reserved.memberId = payload.id
    await book.save()
    
    // return the updated book record
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
  const { id } = req.params
  try {
    // get token
    const token = req.headers.authorization.split('Bearer ')[1]
    // verify the token
    const payload = jwt.verify(token, SECRET_KEY)
    // check if the token is valid. if it's not, throw an error
    if (!payload) {
        const error = new Error('Invalid token.')
        error.status = 404
        return next(error)
    }

    // get the book
    const book = await Book.findById(id)
    // if book doesn't exist, throw error
    if (!book) {
      console.log('Invalid Book ID!')
      const error = new Error(`Invalid Book _id: ${id}`)
      error.status = 404
      return next(error)
    }

    // get the book's reserved status
    const bookStatus = await book.reserved.status
    // if book isn't reserved, throw error
    if (bookStatus === false) {
      const error = new Error(`The book is not reserved!`)
      error.status = 400
      return next(error)
    }

    // get the ID of the reserver
    const reservedBy = await book.reserved.memberId
    // if the book wasn't reserved by the current user, throw error
    if (reservedBy != payload.id) {
      const error = new Error(`You didn't reserve this book. You can't return it!`)
      error.status = 401
      return next(error)
    }

    // set the book's reserved status to false, reset the memberID to null, and save the book
    book.reserved.status = false
    book.reserved.memberId = null
    await book.save()
    
    // get the updated book record
    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })
  } catch (e) {
    console.error(e)
  }
})

module.exports = router