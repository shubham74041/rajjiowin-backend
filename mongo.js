// require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URL = "mongodb://127.0.0.1:27017/project-data";
// const DBURL = process.env.ATLASDB;
console.log("MongoDB URL:", MONGO_URL);
main()
  .then(() => {
    console.log("Connect to DB");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Regular expression to validate mobile numbers
        return /^[0-9]{10}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid mobile number!`,
    },
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
