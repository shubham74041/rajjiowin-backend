const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = express.Router();
const { BuysProducts, Wallet } = require("../mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// GET call for wallet data
router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const data = await Wallet.findOne({ userId: userId });
    if (!data) {
      // If no wallet data is found for the provided userId, send a 404 response
      return res.status(404).json({ error: "Wallet data not found" });
    }
    res.json(data);
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    res.status(500).json({ error: "Internal server error" }); // Send an error response if something goes wrong
  }
});

// api call for wallet data
router.post("/:userId", async (req, res) => {
  const userId = req.params.userId;
  console.log("Body data", req.body);
  const { price, cardData } = req.body;
  console.log(userId);

  // Remove the id field to prevent duplicate key error
  const buyData = {
    userId: userId,
    productTitle: cardData.title,
    productPrice: cardData.price,
    productDailyIncome: cardData.dailyIncome,
    productTotalAmount: cardData.totalAmount,
    productCycle: cardData.cycle,
  };

  try {
    const walletData = await Wallet.findOne({ userId: userId });
    console.log("wallet data", walletData);

    if (walletData.remainingBalance > price) {
      const restBalance = walletData.remainingBalance - parseFloat(price);
      const updatedWallet = {
        remainingBalance: parseFloat(restBalance),
        purchasingAmount: parseFloat(price),
        totalPurchasingAmount:
          walletData.totalPurchasingAmount + parseFloat(price),
      };
      console.log(walletData._id);
      const newData = await Wallet.findByIdAndUpdate(
        walletData._id,
        updatedWallet,
        { new: true }
      );
      const newBuy = await BuysProducts.create(buyData);
      console.log("new Data", newData);
      console.log("new Buy", newBuy);

      res.json({ msg: "Product purchased successfully!" });
    } else {
      res.json({ msg: "Insufficient funds! Please recharge your wallet." });
    }
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Check-in
let userLastCheckIn = {}; // Store last check-in times for simplicity

router.post("/check-in/:userId", async (req, res) => {
  const userId = req.params.userId;

  console.log("User ID:", userId);

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const now = new Date();
  const lastCheckIn = new Date(userLastCheckIn[userId] || 0); // Default to epoch

  const timeSinceLastCheckIn = now - lastCheckIn;
  const oneDay = 24 * 60 * 60 * 1000;

  if (timeSinceLastCheckIn < oneDay) {
    console.log(`User ${userId} has already checked in today`);
    return res
      .status(200)
      .json({ message: "Already checked in today", hasProducts: true });
  }

  try {
    const orderData = await BuysProducts.find({ userId: userId });
    const orderDataArray = orderData || [];

    const wallet = await Wallet.findOne({ userId: userId });
    const userHasProducts = orderDataArray.length > 0;

    if (userHasProducts) {
      userLastCheckIn[userId] = now;

      // Calculate the total productDailyIncome from all orders
      let totalDailyIncome = 0;
      for (const order of orderDataArray) {
        console.log("Order:", order.productDailyIncome); // Process each order as needed
        totalDailyIncome += order.productDailyIncome;
      }

      // Add the totalDailyIncome to the remainingWalletAmount in walletData
      if (wallet) {
        wallet.remainingBalance += totalDailyIncome;
        await wallet.save(); // Save the updated walletData to the database
        console.log(`Wallet for user ${userId} updated successfully`);
      } else {
        console.log(`No wallet found for userId: ${userId}`);
        return res.status(404).json({ message: "Wallet not found for user" });
      }

      return res
        .status(200)
        .json({ message: "Check-in complete", hasProducts: true });
    } else {
      return res
        .status(200)
        .json({ message: "You don't have any products", hasProducts: false });
    }
  } catch (error) {
    console.error("Error processing order:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
