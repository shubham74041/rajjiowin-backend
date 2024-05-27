const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Enable CORS for all routes

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

// api for find user
// app.get("/", async (req, res) => {
//   const { user } = req.body;
//   console.log(user);
//   const data = await User.findOne({ phoneNumber: user });
//   console.log(data);
// });

// Route imports
const loginRoute = require("./routes/login.js");
const signupRoute = require("./routes/signup.js");
const referralRoute = require("./routes/referral.js");
const rechargeRoute = require("./routes/recharge.js");
const rechargeDataRoute = require("./routes/recharge-data.js");
const orderRoute = require("./routes/order.js");
const walletRoute = require("./routes/wallet.js");
const withdrawalRoute = require("./routes/withdrawal.js");
const withdrawDataRoute = require("./routes/withdraw-data.js");

// Use routes
app.use("/login", loginRoute);
app.use("/signup", signupRoute);
app.use("/referral", referralRoute);
app.use("/recharge", rechargeRoute);
app.use("/recharge-data", rechargeDataRoute);
app.use("/order", orderRoute);
app.use("/", walletRoute);
app.use("/withdrawal", withdrawalRoute);
app.use("/withdraw-data", withdrawDataRoute);

// Listen on dynamically assigned port by Vercel
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
