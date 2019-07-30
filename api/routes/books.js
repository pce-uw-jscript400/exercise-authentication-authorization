const router = require('express').Router()
const Book = require('../models/book')
const { SECRET_KEY } = process.env;
const jsonwebtoken = require('jsonwebtoken');

//These values are hard-coded while the jwt isn't working for me
//TODO: remove these values and routes use the payload returned after verifying token

const jwtAdmin = {
  _id: '',
  admin: true
}

const jwtNonAdmin = {
  _id: '',
  admin: false
}



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

  // const token = req.headers.authorization.split('Bearer ')[1];
  // const payload = jsonwebtoken.verify(token, SECRET_KEY);  
  // console.log('payyyyyy', payload);

  // replace with payload and check for admin there
  const isAdmin = jwtAdmin.admin;
  // TODO: make to have a 401 status
  if(!isAdmin) throw new Error('Access Denied');
  
  const book = await Book.create(req.body)

  try {
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

  // TODO: get this working with payload
  // const token = req.headers.authorization.split('Bearer ')[1];
  // const payload = jsonwebtoken.verify(token, SECRET_KEY);

  //TODO: replace with jwt payload
  const isAdmin = jwtAdmin.admin;
  const memberId = '5d3d44a411b04586d55fb799';

  //TODO: make this use a 401
  if (!isAdmin) throw new Error('You must be logged in to reserve a book');


  try {
    const book = await Book.findById(id)
    
    //TODO: make this return a 400
    if(book.reserved.status === false) throw new Error('Book is already reserved');
    
    if (!book) {
      const error = new Error(`Invalid Book _id: ${id}`)
      error.message = 404
      return next(error)
    }

    book.reserved.status = true
    book.reserved.memberId = memberId
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
  const status = 201;
  const message = 'Book return route'
  const { id } = req.params

  // const token = req.headers.authorization.split('Bearer ')[1];
  // const payload = jsonwebtoken.verify(token, SECRET_KEY);
  
  //change this to be based on the payload
  hasValidJWT = true;
  if(!hasValidJWT) throw new Error('There was a problem returning this book');

  const book = await Book.findById(id);
  if(!book) throw new Error('No book with this id');

  //TODO: add a 400
  if(book.reserved.status === false) throw new Error('This book is not reserved');
  

  //TODO: have this use the payload
  //This are just stand-ins for the payload
  const alisonId = '5d3f9e6d6e49ca9119265cf1';
  const robertId = '5d3d44a411b04586d55fb799';

  //TODO: change this to use 401 status code
  if (!robertId === book.reserved.memberId) throw new Error('You can not return this book');

  try {
    book.reserved.memberId = null;
    book.reserved.status = false;

  } catch(e) {
    console.error(e);
    const error = new Error('There was a probem returning the book');
    error.status = 400; 
    next(error);
  }
   
  res.status(status).json({ status, message })
})

module.exports = router