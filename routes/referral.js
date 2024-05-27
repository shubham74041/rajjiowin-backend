const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = express.Router();
const { Referral } = require("../mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Enable CORS for all routes
app.use(cors());

// Referral code endpoint
router.post("/referral", async (req, res) => {
  try {
    const referralCode = generateReferralCode();
    console.log(referralCode);
    // Ensure the referral code is unique
    let existingReferral = await Referral.findOne({ referralCode });
    while (existingReferral) {
      referralCode = generateReferralCode();
      existingReferral = await Referral.findOne({ referralCode });
    }

    const referral = new Referral({ referralCode });
    await referral.save();

    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://finance-king-pi.vercel.app"
    ); // Update with your React app's domain
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With, Content-Type"
    );

    res.json({ referralCode: referral.referralCode });
  } catch (error) {
    console.error("Error generating referral code:", error);
    res.status(500).json({ message: "Failed to generate referral code" });
  }
});

const generateReferralCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

module.exports = router;
