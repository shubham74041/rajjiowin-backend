const express = require("express");
const cors = require("cors");
const User = require("./mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Root endpoint
// app.get("/", async (req, res) => {
//   try {
//     const data = await User.find({});
//     res.json(data);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// Login endpoint
app.post("/", async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      // User does not exist
      // res.json({ success: false, message: "notexist" });
      return;
    }

    if (user.password === password) {
      //Successful login
      res.json(user);
    } else {
      res.json("notexist");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

// Signup endpoint
app.post("/signup", async (req, res) => {
  const { email, phoneNumber, password } = req.body;

  try {
    const isExist = await User.findOne({ phoneNumber: phoneNumber });
    if (isExist) {
      res.json("exists");
      return;
    }
    // Create new user
    await User.create({ email, phoneNumber, password });
    res.json("notexists");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

// Listen on dynamically assigned port by Vercel
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
