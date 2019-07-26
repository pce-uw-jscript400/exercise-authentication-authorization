const mongoose = require("mongoose");
const Book = require("../api/models/book");
const Users = require("../api/models/user");
const config = require("../nodemon.json");

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true });
  await Book.deleteMany(); // Deletes all records
  await Users.deleteMany();
  const users = await Users.create([
    {
      username: "Jack",
      password: "secret_key_123",
      admin: true
    },
    {
      username: "Jill",
      password: "secret_key_456",
      admin: false
    }
  ]);
  const books = await Book.create([
    {
      title: "The Colour of Magic",
      published: 1983,
      authors: [
        {
          name: "Sir Terry Pratchett",
          dob: "04-28-1948"
        }
      ]
    },
    {
      title: "Stardust",
      published: 1997,
      authors: [
        {
          name: "Neil Gaiman",
          dob: "11-10-1960"
        }
      ]
    },
    {
      title:
        "Good Omens: The Nice and Accurate Prophecies of Agnes Nutter, Witch",
      published: 1990,
      authors: [
        {
          name: "Neil Gaiman",
          dob: "11-10-1960"
        },
        {
          name: "Sir Terry Pratchett",
          dob: "04-28-1948"
        }
      ]
    }
  ]);
  let response = {
    books: books,
    users: users
  };
  return response;
};

reset()
  .catch(console.error)
  .then(response => {
    console.log(`Seeds successful! ${
      response.books.length
    } book records created. 
    ${response.users.length} user records created`);
    return mongoose.disconnect();
  });