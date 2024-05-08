const express = require("express");
const cors = require("cors");
const { User, Recharge, Wallet } = require("./mongo.js");

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
      return res.status(401).json({ message: "User not found" });
    }

    if (user.password === password) {
      //Successful login
      return res.status(200).json({
        token: "dancebasanti",
        message: "Login successful",
        data: user,
      });
    } else {
      return res.status(401).json({ message: "Incorrect password" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
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

//

// recharge api
app.post("/recharge", async (req, res) => {
  const { amount, phoneNumber } = req.body;
  // const user = await User.findOne({ phoneNumber: phoneNumber });
  console.log(amount, phoneNumber);
  // console.log("User Data:", user);

  const data = {
    userId: phoneNumber,
    rechargeAmount: Number(amount),
  };
  try {
    await Recharge.create(data);
    res.json(data);
  } catch (err) {
    console.log("Error:", err);
  }
});

// Listen on dynamically assigned port by Vercel
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
