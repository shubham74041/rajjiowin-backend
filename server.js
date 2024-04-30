const express = require("express");
const cors = require("cors");
const User = require("./mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", cors(), (req, res) => {});

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.post("/", async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const data = await User.findOne({ phoneNumber: phoneNumber });
    console.log(data);

    if (data.password === password) {
      res.json("exist");
    } else {
      res.json("notexist");
    }
  } catch (err) {
    console.log(err);
  }
});

//signup
app.post("/signup", async (req, res) => {
  const { email, phoneNumber, password } = req.body;

  const data = {
    email: email,
    phoneNumber: phoneNumber,
    password: password,
  };
  try {
    const isExist = await User.findOne({ phoneNumber: phoneNumber });
    console.log(isExist);
    if (isExist) {
      res.json("exists");
    } else {
      res.json("notexists");
      await User.insertMany([data]);
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(8080, () => {
  console.log("Listening on port 8080");
});
