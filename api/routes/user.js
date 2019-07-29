const router = require('express').Router()
const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { SECRET_KEY } = process.env

router.post('/signup', async (req, res, next) => {
    const status = 201
    const badRequest = 400
    let userExists = false
    try{
        const{user, password, admin} = req.body
        if(!user){
            throw new Error('A user name is required')
        }
        if(password.length < 8){
            throw new Error('Passwords must be at least 8 characters')
        }
        const existingUser = await User.findOne({user})
        if(existingUser){
            userExists = true
            throw new Error('That username is already taken.  Please try another.')
        }
        
        const salt = 10
        const bcryptPassword = await bcrypt.hash(password, salt)
        const response = await User.create({
            user:user, 
            password:bcryptPassword,
            admin: admin
        })
        const payload = { id: response._id }
        const options = { expiresIn: '1 day' }
        const token = jwt.sign(payload, SECRET_KEY, options)

        res.status(status).json({status, token})

        
    }catch(error){
        console.log(error.message)
        
        const e = new Error()
        if(userExists === true){
          e.message = error.message
          e.status = 422
        }else{
          e.message = error.message
          e.status = 400
        }
        next(e)
    }
  })
  router.post('/login',async (req,res,next)=>{
    const status = 201
    const{user, password}=req.body
    let userFound = false
    let correctPassword = false
    const message = "Whoops looks like you typed in incorrect credentials"
    try{
      const userInfo = await User.findOne({user})
      if(!userInfo){
        throw new Error(message)
      }
      userFound = true
      const validPassword = await bcrypt.compare(password, userInfo.password)
      if(!validPassword){
        correctPassword = false
        throw new Error(message)
      }

      //create token
      const payload = { id: user._id }
      const options = { expiresIn: '1 day' }
      const token = jwt.sign(payload, SECRET_KEY, options)

      res.status(status).json({status, token})

    }catch(error){
      const e = new Error()
      if(!userFound || !correctPassword){
        e.message = error.message
        e.status = 400
      }else{
        e.message = `Whoops something went wrong - please try again!`
        e.status = 418
      }
      next(e)
    }
  })
  
  router.patch('/:id/permissions', async(req,res,next)=>{
      try{
          const {admin} = req.body
          const id = req.params.id
          console.log(`Admin: ${admin} and id : ${id}`)
        const token = req.headers.authorization.split('Bearer ')[1]
        const payload = jwt.verify(token, SECRET_KEY)
        const user = await User.findById({ _id: payload.id }).select('-__v -password')
        console.log(user)
        if(user.admin != true){
            const error = new Error('Please contact an admin to perform this task')
            error.status = 401
            throw error
        }
        const changeUser = await User.findById(req.params.id)
        if(!changeUser){
            const error = new Error('The user does not exist')
            error.status = 404
            throw error
        }
        if(!admin){
            const error = new Error('An admin value is needed')
            error.status = 400
            throw error
        }
        changeUser.admin = req.body.admin
        const status = 200
        const response = await changeUser.save()
        res.status(status).json({status, message:'Update successful'})
      }catch(error){
        
        
        next(error)
      }
  })

module.exports = router