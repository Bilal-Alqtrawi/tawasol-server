const cors = require("cors"); // Library allow to access to server side from another out of server side
const express = require("express");
const connectDB = require("./config/db");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json()); // Parese Request From Client
app.use(cors()); // allow access from out side the server

// http://localhost:5000/api/users/createUser
// Explain: /api/users/ => main Url and every thing after that will read it from file who required it

var cron = require("node-cron");

cron.schedule("* * * * *", () => {
  console.log("running a task every minute");
});

app.use("/api/users", require("./routes/users.js"));
app.use("/api/profiles", require("./routes/profiles.js"));
app.use("/api/posts", require("./routes/posts.js"));
connectDB();

// app.use(express.static(__dirname + "/public"));
// app.use("/images", express.static("public/images"));
app.use("/images", (req, res) => {
  const imagePath = path.join(__dirname, "public", "images", req.path);
  const defaultImagePath = path.join(
    __dirname,
    "public",
    "images",
    "default.png"
  ); // مسار الصورة الافتراضية

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      // إذا لم تكن الصورة موجودة، أرسل الصورة الافتراضية
      res.sendFile(defaultImagePath);
    } else {
      // إذا كانت الصورة موجودة، أرسلها
      res.sendFile(imagePath);
    }
  });
});

// Create Get API
// When call this API Will
app.get("/", (req, res) => res.send("Server Is Working Correctely"));

// In Hourko سيكون في env variable ,الأبلكيشن تبعي راح يقرأ هذا المتغير
const PORT = process.env.PORT || 5000; // Default 5000

// To Start Server run
// Callback function will execute  after listen start
app.listen(PORT, () => {
  console.log(`Server Start On PORT ${PORT}`);
});
