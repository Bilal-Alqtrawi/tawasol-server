const express = require("express");
const { auth, upload } = require("../utils/index");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const normalize = require("normalize-url");
const Profile = require("../models/Profile");
const User = require("../models/User");
const Post = require("../models/Post");
/* 
1.  POST /profiles (API create Or Update FOR Profile)
2.  GET /profiles/me (return current profile to current user)
3.  GET /profiles (return all profiles for all users)
4.  GET /profiles/user/user_id (return  specific profile for user)
5.  DELETE /profiles (Delete User, Profile him, All Posts created)
6.  POST /profiles/upload (upload Image In Server)
7.  PUT /profiles/experience (add new experience to exisisting profile)
8.  DELETE /profiles/experience/:exp_id (delete for specific experienc for user)
9.  PUT /profiles/education (add education inside specific Profile)
10. DELETE /profiles/education/:edu_id (delete حسب ال education_id)
*/

router.post(
  "/",
  auth,
  check("status", "Status is required").notEmpty(),
  check("skills", "Skills is required").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    /* 
    "company": "BILAL",
    "status": "Junior Developer",
    "skills": "HTML", "CSS", "PHP", "JAVASCRIPT",
    "website": "mywebsite.com",
    "location": "Gaza",
    "bio": "I am a software engineer and studied in the Al-Azher unviersity"
    "youtube": "",
    "twitter": "",
    "github": "",
    */
    const {
      website,
      skills,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      github,
      ...rest
    } = req.body;

    const profile = {
      user: req.user.id,
      website:
        website && website !== ""
          ? normalize(website, { forceHttps: true })
          : "",
      skills: Array.isArray(skills)
        ? skills
        : skills.split(",").map((skill) => skill.trim()),
      ...rest,
    };
    const socialFields = {
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
      github,
    };

    for (let key in socialFields) {
      const value = socialFields[key];
      if (value && value !== "") {
        socialFields[key] = normalize(value, { forceHttps: true });
      }
    }
    profile.social = socialFields;
    try {
      // (filter, object u want edit it in DB,{ new => if true mean after edit return new info to client, upsert: true => if profile not exist , will create profile} )
      //   $set: profile to sent object to DB
      let profileObject = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profile },
        { new: true, upsert: true }
      );
      return res.json(profileObject);
    } catch (err) {
      console.error(err.message);
      return res.status(500).send(err.message);
    }
  }
);

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name"]);
    if (!profile) {
      return res.status(400).send({ msg: "There Is No Profile For This User" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

router.get("/", auth, async (req, res) => {
  try {
    // without filter he return all data in profile collection
    const profiles = await Profile.find().populate("user", ["name"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

// "/user/:user_id" Recive parameter after user
router.get("/user/:user_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name"]);

    if (!profile) {
      return res
        .status(400)
        .send({ msg: "There Is No Profile For the given User" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    return res.status(500).send(err.message);
  }
});

router.delete("/", auth, async (req, res) => {
  // Remove posts, profile, user
  try {
    await Promise.all([
      Post.deleteMany({ user: req.user.id }), // delete all posts for this user
      Profile.findOneAndDelete({ user: req.user.id }),
      User.findOneAndDelete({ _id: req.user.id }),
    ]);
    res.json({ msg: "User Information Is Deleted Successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

router.post("/upload", auth, async (req, res) => {
  try {
    console.log("inside upload");
    // multer give us this property for upload with 3 Params
    upload(req, res, async (err) => {
      if (err) {
        console.log("Error:" + err);
        res.status(500).send(`Server Error: ${err}`);
      } else {
        try {
          res.status(200).send(req.user.id);
        } catch(err) {
          console.log(err);
        }
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});



router.put(
  "/experience",
  auth,
  check("title", "Title is required").notEmpty(),
  check("company", "Company is required").notEmpty(),
  check("from", "From date is required and needs to be from the past")
    .notEmpty()
    .custom((value, { req }) => {
      return req.body.to ? value < req.body.to : true;
    }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({
        user: req.user.id,
      });
      // Add experience
      profile.experience.unshift(req.body);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });
    // filter out
    profile.experience = profile.experience.filter((exp) => {
      // _id => DB create by default automatic id for every user
      return exp._id.toString() !== req.params.exp_id;
    });
    await profile.save();
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

router.put(
  "/education",
  auth,
  check("school", "School is required").notEmpty(),
  check("degree", "Degree is required").notEmpty(),
  check("fieldofstudy", "field of study is required").notEmpty(),
  check("from", "From date is required and needs to be from the past")
    .notEmpty()
    .custom((value, { req }) => {
      return req.body.to ? value < req.body.to : true;
    }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const profile = await Profile.findOne({
        user: req.user.id,
      });
      // Add experience
      profile.education.unshift(req.body);
      await profile.save();
      return res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send(err.message);
    }
  }
);

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });
    // filter out
    profile.education = profile.experience.filter((edu) => {
      return edu._id.toString() !== req.params.edu_id;
    });
    await profile.save();
    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

module.exports = router;
