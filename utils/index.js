const jwt = require("jsonwebtoken");
const config = require("config");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
// const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res
      .status(401)
      .json({ msg: "Token Is Not Available, authorization denied" });
  }

  try {
    jwt.verify(token, config.get("jwtSecret"), (error, decoded) => {
      if (error) {
        return res
          .status(401)
          .json({ msg: "Token Is Not Valid, authorization denied" });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: err.message });
  }
};

// Multer disk storage

const storage = multer.memoryStorage();

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "..", "uploads"));
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `${req.user.id}-${Date.now()}${ext}`);
//   },
// });

const upload = multer({ storage }).single("file");

// Upload to Cloudinary using buffer
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profiles" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};
module.exports = { auth, upload, uploadToCloudinary };
