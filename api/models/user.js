const mongoose = require("mongoose");

const schema = mongoose.Schema({
  username: String,
  password: String,
  admin: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", schema);
