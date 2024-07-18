const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = express.Router();
const { Recharge } = require("../mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// recharge api
router.post("/recharge", async (req, res) => {
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

module.exports = router;
