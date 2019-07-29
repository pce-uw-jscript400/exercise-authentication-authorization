const router = require('express').Router()
const Book = require('../models/book')

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
    const token = req.headers.authorization.split('Bearer ')[1]
    const payload = jwt.verify(token, SECRET_KEY)
    const user = await User.findById({ _id: payload.id }).select('-__v -password')
    console.log(user)
    if(user.admin != true){
        const error = new Error('Please contact an admin to perform this task')
        error.status = 401
        next(error)
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
  try {
    const book = await Book.findById(id)
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.message = 404
      return next(error)
    }

    book.reserved.status = true
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
  const status = 200
  const message = 'You must implement this route!'
  
  console.log(message)
  res.status(status).json({ status, message })
})

module.exports = router