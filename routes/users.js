const express = require("express");
// by using router Object can Router.get,Put,post
const router = express.Router();
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const bycrpt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { auth } = require("../utils/index");
// check function help to validate the request from client

// Post يمثل ال  Register route
/*  API:
    - Get The Request Body(data register for user)
    - Validate the request body
    - cheack if user exists, if yes , return error
    - Encrypt password
    - Save Data in DataBase
    - using JWT Create Token contains user id  Return Token.
*/
/* 
  Path: POST /api/users/register
  Desc: Register a New Users
  Public
*/
// Middle wheres => execute before process in callback function
// rule is nontEmpty : if empty will return Name Is Required
router.post(
  "/register",
  check("name", "Name is required").notEmpty(),
  check("email", "Please include a vaild email").isEmail(),
  check(
    "password",
    "Please choose a password with at least 6 characters"
  ).isLength({ min: 6 }),
  async (req, res) => {
    // if happen error in check will store in erros object
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Data Sent From Client Send to server As JSON Object
    // To Work Should Add body in server.js
    const { name, email, password } = req.body;

    // res.send("Success In Sending Data");

    try {
      // findOne return Promise recode of user match with this this email
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User alread exists" }] });
      }
      user = new User({
        name,
        email,
        password,
      });
      const salt = await bycrpt.genSalt(10);
      user.password = await bycrpt.hash(password, salt);
      await user.save();

      //  Token
      const payload = {
        user: {
          id: user.id,
        },
      };
      // create token (payload value you want sign)
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: "5 days",
        },
        (err, token) => {
          if (err) {
            throw err;
          } else {
            res.json({ token });
          }
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

/* 
  Path: POST /api/users/login
  Desc: logins an Existing Users
  Public
*/
router.post(
  "/login",
  check("email", "Please include a vaild email").isEmail(),
  check(
    "password",
    "Please choose a password with at least 6 characters"
  ).isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // This's from client
    const { email, password } = req.body;

    try {
      // التخاطب مع الداتا بيز ليبحث ازا كان اليوزر  موجود او  لا حسب الايميل
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "invalid Credentials" }] });
      }

      // match them and return boolean
      const isMatch = await bycrpt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "invalid Credentials" }] });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };
      // create token (payload value you want sign)
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: "5 days",
        },
        (err, token) => {
          if (err) {
            throw err;
          } else {
            res.json({ token });
          }
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

/* 
  Path: Get /api/users
  Desc: Takes A token and returns user Information
  Private
*/

router.get("/", auth, async (req, res) => {
  try {
    // Search In DB
    // req.user.id (will get it from token)
    // return all data باسثناء الباسورد
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;
