const router = require('express').Router()
const Book = require('../models/book')
const User = require('../models/user')
const jsonwebtoken = require('jsonwebtoken');
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
  const status = 201
  try {
    //  Valid JWT is not provided 401
    const token = req.headers.authorization.split('Bearer ')[1]
    if (!token) {
        const error = new Error (`Invalid token.`)
        error.status = 401
        next(error)
    }
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    
    // JWT token is for a user who is not an admin 401
    const clientUser = await User.findOne({ _id: payload.id })
      .select('-__v -password')
    if (!clientUser.admin === true) {
        const error = new Error (`Insufficient privelages.`)
        error.status = 401
        next(error)
    }
    
    const book = await Book.create(req.body)
    if (!book) throw new Error(`Request body failed: ${JSON.stringify(req.body)}`)
    
    const response = await Book.findById(book._id).select('-__v')
    res.json({ status, response })
  } catch (e) {
    console.error(e)
    next(e)
  }
})

// You should only be able to reserve a book if a user is logged in
router.patch('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  try {
    const token = req.headers.authorization.split('Bearer ')[1]    
    // A valid JWT token is not provided (status 401)
    if (!token) {
        const error = new Error (`Invalid token.`)
        error.status = 401
        next(error)
    }
    const payload = jsonwebtoken.verify(token, SECRET_KEY)
    
    const book = await Book.findById(id)
    // Book cannot be found (status 404)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.message = 404
      return next(error)
    }

    // The book is already reserved (status 400)
    if (book.reserved.status === true) {
      const error = new Error(`Book is already reserved.`)
      error.message = 400
      return next(error)

    } else if (book.reserved.status === false){
      book.reserved.status = true
      // Set the reserved memberId to the current user
      book.reserved.memberId = payload.id
      await book.save()
      
      const response = book
      const status = 200
      res.json({ status, response })
    }
  } catch (e) {
    console.error(e)
    next(e)
  }
})

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {
  const status = 200
  const { id } = req.params
  try {
    const token = req.headers.authorization.split('Bearer ')[1]    
    // A valid JWT token is not provided (status 401)
    if (!token) {
        const error = new Error (`Invalid token.`)
        error.status = 401
        next(error)
    }
    const payload = jsonwebtoken.verify(token, SECRET_KEY) 

    const book = await Book.findById(id)
    // Book cannot be found (status 404)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.message = 404
      return next(error)
    }
    
    // The book is not reserved (status 400)
    if (book.reserved.status === false) {
      const error = new Error(`Book is not reserved.`)
      error.message = 400
      return next(error)
    }

    //  The book is reserved by a different user (status 401)
    if (book.reserved.memberId != payload.id) {
      const error = new Error(`Book is reserved by a different user.`)
      error.message = 401
      return next(error)
    }

    if (book.reserved.status === true){
      // Set the reserved memberId to the current user
      book.reserved.status = false
      book.reserved.memberId = null
      await book.save()
      
      const response = book
      const status = 200
      res.json({ status, response })
    }
  } catch (e) {
    console.error(e)
    next(e)
  }
})

module.exports = router