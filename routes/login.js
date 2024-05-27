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

router.post("/", async (req, res) => {
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

module.exports = router;
