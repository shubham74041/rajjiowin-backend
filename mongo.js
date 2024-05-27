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
  referralCode: { type: String, unique: true },
});

const User = mongoose.model("User", userSchema);

const referralSchema = new mongoose.Schema({
  referralCode: { type: String, required: true, unique: true },
});

const Referral = mongoose.model("Referral", referralSchema);

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
const productBuySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  productTitle: {
    type: String,
    required: true,
  },
  productPrice: {
    type: Number,
    required: true,
  },
  productDailyIncome: {
    type: Number,
    required: true,
  },
  productTotalAmount: {
    type: Number,
    required: true,
  },
  productCycle: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});
const BuyProduct = mongoose.model("BuysProducts", productBuySchema);

// All Products details Schema

const productDetailsSchema = new mongoose.Schema({
  // id: 1,
  // title: "Plan A",
  // price: 550,
  // dailyIncome: 15.5,
  // totalAmount: 1155,
  // cycle: "75 days",

  id: {
    type: Number,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  dailyIncome: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  cycle: {
    type: String,
    required: true,
  },
});

const Products = mongoose.model("Products", productDetailsSchema);

// Withdraw Schema
const withdrawSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  withdrawalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["bank", "upi"],
    required: true,
  },
  bankName: {
    type: String,
    required: function () {
      return this.paymentMethod === "bank";
    },
  },
  accountNumber: {
    type: String,
    required: function () {
      return this.paymentMethod === "bank";
    },
  },
  accountHolderName: {
    type: String,
    required: function () {
      return this.paymentMethod === "bank";
    },
  },
  IFSCCode: {
    type: String,
    required: function () {
      return this.paymentMethod === "bank";
    },
  },
  upiId: {
    type: String,
    required: function () {
      return this.paymentMethod === "upi";
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Withdraw = mongoose.model("Withdraw", withdrawSchema);

module.exports = {
  User,
  Recharge,
  Wallet,
  Products,
  Withdraw,
  BuyProduct,
  Referral,
};
