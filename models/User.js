const mongoose = require("mongoose");

// Schema => represent  Model
// Define All collection (as Table) in user section
// inside Schema(will define All field for user)
// Fileds For Register /User
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // this mean every user have own email
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Name Of Collection and the Schema
module.exports = User = mongoose.model("user", UserSchema);
