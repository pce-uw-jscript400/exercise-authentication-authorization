const router = require('express').Router()
const Book = require('../models/book')
const User = require('../models/user')

router.get('/', async (req, res, next) => {

  validToken = tokenValidate(req);
  const user = await User.findOne({ _id: validToken.id })
  if (user.admin == true) { 

    const status = 200
    const response = await Book.find().select('-__v')
  } else {
    status = 401
  }
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
  validToken = tokenValidate(req);
  const user = await User.findOne({ _id: validToken.id })
  
  if (!user.admin == true) {
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
 } else { res.status(401).json({ status, response: 'User is not admin.' })}
})

// You should only be able to reserve a book if a user is logged in
router.patch('/:id/reserve', async (req, res, next) => {
  const { id } = req.params
  validToken = tokenValidate(req);
  const user = await User.findOne({ _id: validToken.id })
  if (validToken) {
    try {
      const book = await Book.findById(id)
      if (!book) {
        const error = new Error(`Invalid Book _id: ${id}`)
        error.message = 404
        return next(error)
      }
      if (!book.reserved.status == true) {
        book.reserved.status = true
        // Set the reserved memberId to the current user
        await book.save()
        
        const response = await Book.findById(book._id).select('-__v')
        const status = 200
        res.json({ status, response })
      } else { res.status(400).json({ status, response: 'The book is already reserved' })}

    } catch (e) {
      console.error(e)
    } 
  } else { res.status(401).json({ status, response: 'Invalid Token' })}
}) 

// You should only be able to return a book if the user is logged in
// and that user is the one who reserved the book
router.patch('/:id/return', async (req, res, next) => {
  validToken = tokenValidate(req);
  const user = await User.findOne({ _id: validToken.id })

  if (validToken) {
    const status = 200
    const book = await Book.findById(id)
    
    // 404 if unable to find book.
    if (!book) { res.status(404).json({ status, response: 'Unable to find book' })}

    // 400 if book is not reserved.
    if (book.reserved.status == false) { res.status(400).json({ status, response: 'The book is not reserved' })}

    // 401 if ID of the user that checked out the book does not match.
    if (tokenValidate._id != book.reserved.memberID) { res.status(401).json({ status, response: 'The book is reserved but not by this user.' })}
    
    // After validation, set reserved status to false, and memberId to null
    book.reserved.status = false
    reserved.memberId = null

    console.log(message)
    res.status(status).json({ status, message })
  } else { res.status(401).json({ status, response: 'Invalid Token' })}
})

function tokenValidate(req) {
  const token = req.headers.authorization.split('Bearer ')[1]
  const payload = jsonwebtoken.verify(token, SECRET_KEY)
  
  return payload
} 

module.exports = router