require("dotenv").config();
const mongoose = require("mongoose");

// Check if the MongoDB URL is properly configured in the environment variables
const MONGO_URL = "mongodb://127.0.0.1:27017/project-data";

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => console.error("Error connecting to DB:", err));

async function main() {
  // Add useNewUrlParser and useUnifiedTopology options to the connect method
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB");
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
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
