# Exercise: Library Access

This exercise will assess your ability to build a fully working API with MongoDB that includes authentication and authorization.

## Setup

1. Fork & clone

1. `cp nodemon.sample.json nodemon.json`

1. Create a new Cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) titled something like `general-purpose` or reuse one you already have.

1. Update the `MONGO_DB_CONNECTION` in your `nodemon.json` file with the full connection string. Make sure you include the password you set up for the database and change the name of the database from `test` to something lke `library_access_dev`.

1. `npm install`

1. `npm run reset-db`

1. `npm run dev`

## Documentation

Currently, this repository includes an API with the following routes:

#### GET /api/books

Retrieve all books.

#### GET /api/books/:id

Retrieve a specific book by id.

#### POST /api/books

Create a new book.

#### PATCH /api/books/:id/reserve

Reserve a book.

## Instructions

To complete this exercise, you will need to do the following:

- [ ] **Create a User Model:** Users have a `username`, a `password`, and an `admin` property which is set to `false` by default.

+ [ ] **Create a `POST /api/signup` route:** Create a new route that allows someone to create an account. Securely store the password using the `bcrypt` package. On successful creation, return a JWT token. You should return an error in the following cases:
  * Username is not provided
  * Username is already taken
  * Password is not provided
  * Password is less than 8 characters

- [ ] **Create a `POST /api/login` route:** Create a new route that allows someone to login. On successful creation, return a JWT token. You should return an error in the following cases:
  * Username is not found
  * Username and password do not match

- [ ] **Add an admin User and a regular user to the `./db/seeds.js` file:** In the `seeds.js` file, when the `reset()` function is run, create a new User who has admin permissions and another User without admin permissions. Make sure that both users will be deleted and then recreated whenever the function is run.

- [ ] **Create a `PATCH /api/users/:id/permissions` route:** Create a new route that allows for an admin to change permissions of another user. The route should only be looking for the `admin: <boolean>` key in the request body and setting the value appropriately. On success, return a status 204. You should return an error in the following cases:
  * A valid JWT token is not provided (status 401)
  * The JWT token is for a user who is not an admin (status 401)
  * User cannot be found (status 404)
  * The request body does not include an `admin` key with a boolean value (status 400)

- [ ] **Update the `POST /api/books` route:** This route should only be available to users who are admins. If the user is an admin, proceed as normal. If they are not an admin, return an error message with a status code of 401.

- [ ] **Update the `POST /api/books/:id/reserve` route:** This route allows for someone to reserve a book. If the user is logged in, proceed as normal. You should return an error in the following cases:
  * A valid JWT token is not provided (status 401)
  * The book is already reserved (status 400)
  * Book cannot be found (status 404)

- [ ] **Create a `PATCH /api/books/:id/return` route:** This route should return a book if the user has already reserved it. If the appropriate user is returning the book, set the `reserved.status` to `false` and update the `reserved.memberId` to be `null`. You should return an error in the following cases:
  * A valid JWT token is not provided (status 401)
  * The book is reserved by a different user (status 401)
  * The book is not reserved (status 400)
  * Book cannot be found (status 404)