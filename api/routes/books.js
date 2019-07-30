const router = require('express').Router()
const Book = require('../models/book')
const helper = require('../helper/helper')

//Get all books route
router.get('/', async (req, res, next) => {
  const status = 200
  const response = await Book.find().select('-__v')

  res.json({ status, response })
})//End of get all books route


//Get certain book route
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
})//End of get certain book route


// You should only be able to create a book if the user is an admin - DONE
router.post('/', helper.bookAdmins, async (req, res, next) => {
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
})//End of book creation route


// You should only be able to reserve a book if a user is logged in - DONE
router.patch('/:id/reserve', helper.reserver, async (req, res, next) => {
  const { id } = req.params
  try {

    const book = await Book.findById(id)

    if (!book) {
      const error = new Error(`Book _id: ${id} cannot be found.`)
      error.message = 404
      return next(error)
    }

    //Checks to see if the book is available to reserve.
    //If it is already reserved return a status of 400 and message that its already reservered
    if(book.reserved.status == false){
      book.reserved.status = true
      book.reserved.memberId = req.userId

      // Set the reserved memberId to the current user
      await book.save()
    }else{
      const status = 400
      const message = `The book ${id} is already reserved.`
      return res.status(status).json({status, message})
    }

    const response = await Book.findById(book._id).select('-__v')
    const status = 200
    res.json({ status, response })

  }catch (e) {
    console.error(e)
    const message = `Book ${id} cannot be found.`
    const error = new Error(message)
    error.status = 404
    next(error)
  }
})//End of reserve patch route



// You should only be able to return a book if the user is logged in - DONE
// and that user is the one who reserved the book
router.patch('/:id/return', helper.returner, async (req, res, next) => {
  const { id } = req.params
  try{
    const status = 200
    const book = await Book.findById(id)

    //Check to see if the book is not yet reserved
    if(book.reserved.status == false){
      const status = 400
      const message = `The book ${id} is NOT yet reserved.`
      return res.status(status).json({status, message})
    }else if(book.reserved.status == true && book.reserved.memberId == req.userId){ //Check to see if the book is reserved by the logged in user.
      //Set status and memberID to false and null
      book.reserved.status = false
      book.reserved.memberId = null
      //Save book object in database
      await book.save()

      const status = 201
      const message = `You have SUCCESSFULLY Returned book ${id}.`

      return res.status(status).json({status, message, book})
    }else{ //Check to see if the book is reserved by a different user than that who is logged in.
      const status = 401
      const message = `The book is reserved by a different user`
      return res.status(status).json({status, message})
    }


  }catch(e){
    //Error handler
    console.error(e)
    const message = `Book ${id} cannot be found.`
    const error = new Error(message)
    error.status = 404
    next(error)
  }


})//End of return patch route

module.exports = router
