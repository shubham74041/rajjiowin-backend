const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = express.Router();
const { User } = require("../mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

//Signup endpoint
// Handle signup with referral code
router.post("/signup", async (req, res) => {
  const { email, phoneNumber, password, referralCode } = req.body;

  try {
    const isExist = await User.findOne({ phoneNumber: phoneNumber });
    if (isExist) {
      res.json("exists");
      return;
    }

    // Create new user with the provided referral code or generate a new one
    await User.create({ email, phoneNumber, password, referralCode });
    res.json("notexists");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

module.exports = router;
