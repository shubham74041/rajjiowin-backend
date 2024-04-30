const mongoose = require("mongoose");

// Load environment variables
require("dotenv").config();

const DBURL = process.env.ATLASDB;

console.log("MongoDB URL:", DBURL);

// Connect to MongoDB
main()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => console.log("MongoDB connection error:", err.message));

async function main() {
  await mongoose.connect(DBURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Define user schema
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
