//  mongoose Library will use it to connect with database
const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoConnectionString");

const connectDB = async () => {
  try {
    await mongoose.connect(db);
    console.log("Connected To MongoDB Successfully");
  } catch (err) {
    console.error(err.message);
    process.exit(1); // if dont connect بطريقة صحيحة
  }
  // connect(connection string)Return promise
};
module.exports = connectDB;
