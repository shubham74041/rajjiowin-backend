const mongoose = require("mongoose");

// Load environment variables
require("dotenv").config();

const DBURL =
  "mongodb+srv://piyush2909:X42h2Gmo2LvR7Uer@cluster1.yv0fibk.mongodb.net/test?retryWrites=true&w=majority";

// mongodb+srv://piyush2909:X42h2Gmo2LvR7Uer@cluster1.yv0fibk.mongodb.net/project-data?retryWrites=true&w=majority

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

// Define recharge Schema
const rechargeSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  rechargeAmount: {
    type: Number,
    required: true,
  },
  paid: {
    type: Boolean,
    default: false, // Assuming recharge is unpaid by default
  },
});

const Recharge = mongoose.model("Recharge", rechargeSchema);

// Define wallet schema
const walletSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  userTotalAmount: {
    type: Number,
    required: true,
  },
  remainingBalance: {
    type: Number,
    required: true,
  },
  purchasingAmount: {
    type: Number,
    required: true,
  },
  totalPurchasingAmount: {
    type: Number,
    required: true,
  },
});

const Wallet = mongoose.model("Wallet", walletSchema);

// product buy schema
// const productBuySchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//   },
//   walletAmount: {
//     type: Number,
//     required: true,
//   },
//   productPrice: {
//     type: Number,
//     required: true,
//   },
// });

module.exports = {
  User,
  Recharge,
  Wallet,
};
