const mongoose = require("mongoose");
const Book = require("../api/models/book");
const User = require("../api/models/user");
const config = require("../nodemon.json");

const reset = async () => {
  mongoose.connect(config.env.MONGO_DB_CONNECTION, { useNewUrlParser: true });
  await Book.deleteMany(); // Deletes all records
  await User.deleteMany(); // Deletes all User documents
  return (
    await Book.create([
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
    ]),
    await User.create([
      {
        username: "Admin User",
        password: "password1",
        admin: true
      },
      {
        username: "Regular User",
        password: "password2",
        admin: false
      }
    ])
  );
};

reset()
  .catch(console.error)
  .then(response => {
    console.log(`Seeds successful! ${response.length} records created.`);
    return mongoose.disconnect();
  });
