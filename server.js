const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  User,
  Recharge,
  Wallet,
  Withdraw,
  BuysProducts,
  Referral,
} = require("./mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Enable CORS for all routes

// Root endpoint
// app.get("/", async (req, res) => {
//   try {
//     const data = await User.find({});
//     res.json(data);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// api for find user
// app.get("/", async (req, res) => {
//   const { user } = req.body;
//   console.log(user);
//   const data = await User.findOne({ phoneNumber: user });
//   console.log(data);
// });

// Login endpoint
app.post("/", async (req, res) => {
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

// Referral code endpoint
app.post("/referral", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    let referral = await Referral.findOne({ email });

    if (!referral) {
      const referralCode = generateReferralCode();
      referral = new Referral({ email, referralCode });
      await referral.save();
    }

    res.json({ referralCode: referral.referralCode });
  } catch (error) {
    console.error("Error generating referral code:", error);
    res.status(500).json({ message: "Failed to generate referral code" });
  }
});

// Generate a referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

// Signup endpoint
// Handle signup with referral code
app.post("/signup", async (req, res) => {
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

// recharge api
app.post("/recharge", async (req, res) => {
  const { amount, phoneNumber } = req.body;
  // const user = await User.findOne({ phoneNumber: phoneNumber });
  console.log(amount, phoneNumber);
  // console.log("User Data:", user);

  const data = {
    userId: phoneNumber,
    rechargeAmount: Number(amount),
  };
  try {
    await Recharge.create(data);
    res.json(data);
  } catch (err) {
    console.log("Error:", err);
  }
});

// get for admin
app.get("/recharge-data", async (req, res) => {
  const userData = await Recharge.find({});
  // console.log(userData);
  res.json(userData);
});

// updating data
app.post("/recharge-data/:id", async (req, res) => {
  const id = req.params.id;
  const { userId, rechargeAmount, paid } = req.body;
  try {
    const updatedData = await Recharge.findOneAndUpdate(
      { _id: id },
      { paid: paid },
      { new: true }
    );
    console.log("New Updated Data:", updatedData);
    if (updatedData.paid === true) {
      const isUser = await Wallet.findOne({ userId: userId });
      console.log("user", isUser);
      if (!isUser) {
        // If no user found, create a new wallet
        const newWallet = {
          userId: userId,
          userTotalAmount: rechargeAmount,
          remainingBalance: rechargeAmount,
          purchasingAmount: 0,
          totalPurchasingAmount: 0,
        };
        const newValue = await Wallet.create(newWallet);
        console.log(newValue);
      } else if (isUser.userId === updatedData.userId) {
        const addWallet = {
          userTotalAmount: isUser.userTotalAmount + rechargeAmount, // Access userTotalAmount from isUser
          remainingBalance: isUser.remainingBalance + rechargeAmount,
        };
        const updatedWallet = await Wallet.findOneAndUpdate(
          { userId: userId },
          addWallet,
          { new: true }
        );
        console.log(updatedWallet);
      }
    }

    // console.log(updatedData);
    res.status(200).send("Data updated successfully");
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).send("Internal server error");
  }
});

// GET call for wallet data
app.get("/:id", async (req, res) => {
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
app.post("/:userId", async (req, res) => {
  const userId = req.params.userId;
  console.log("Body data", req.body);

  const { price, cardData } = req.body;
  console.log(userId);

  // Check if cardData exists
  if (!cardData) {
    return res.status(400).json({ message: "Card data is required" });
  }

  // Check if all required fields in cardData are present
  const {
    id,
    title,
    price: cardPrice,
    dailyIncome,
    totalAmount,
    cycle,
  } = cardData;
  if (!id || !title || !cardPrice || !dailyIncome || !totalAmount || !cycle) {
    return res.status(400).json({ message: "Incomplete card data" });
  }

  const buyData = {
    userId: userId,
    id: id,
    productTitle: title,
    productPrice: cardPrice,
    productDailyIncome: dailyIncome,
    productTotalAmount: totalAmount,
    productCycle: cycle,
  };

  try {
    // Assuming Wallet is your Mongoose model
    const walletData = await Wallet.findOne({ userId: userId });
    console.log("wallet data", walletData);

    if (!walletData) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (walletData.remainingBalance > price) {
      const restBalance = walletData.remainingBalance - parseFloat(price);
      const updatedWallet = {
        remainingBalance: parseFloat(restBalance),
        purchasingAmount: parseFloat(price),
        totalPurchasingAmount:
          walletData.totalPurchasingAmount + parseFloat(price),
      };

      // Use the document _id for findByIdAndUpdate
      const newData = await Wallet.findByIdAndUpdate(
        walletData._id, // Use _id field as the document ID
        updatedWallet,
        { new: true } // Return the updated document
      );

      const newBuy = await BuysProducts.create(buyData);
      console.log("new Data", newData);
      console.log("new Buy", newBuy);

      // Send the updated wallet data as a JSON response
      res.json({ msg: "Product purchased successfully!" });
    } else {
      // If userTotalAmount is not greater than 100, send an error response
      res.json({ msg: "Insufficient funds! Please recharge your wallet." });
    }
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    res.status(500).json({ error: "Internal server error" }); // Send an error response if something goes wrong
  }
});

//withdrawal api
app.post("/withdrawal/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  console.log("userId", id);
  // console.log("Withdrawal data", data);

  let newData = {}; // Use 'let' instead of 'const'

  if (data.method === "bank") {
    newData = {
      userId: id,
      withdrawalAmount: data.withdrawalAmount,
      paymentMethod: data.method,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolderName: data.accountHolderName,
      IFSCCode: data.ifscCode, // Ensure 'ifscCode' matches the incoming field name
    };
  } else {
    newData = {
      userId: id,
      withdrawalAmount: data.withdrawalAmount,
      paymentMethod: data.method,
      upiId: data.upiId,
    };
  }

  try {
    const newWithdrawal = await Withdraw.create(newData);
    // console.log("Withdrawal data:", newWithdrawal);
    res.status(201).send(newWithdrawal);
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res
      .status(500)
      .send({ error: "An error occurred while processing the withdrawal." });
  }
});

//WithdrawData
app.get("/withdraw-data/:id", async (req, res) => {
  const id = req.params.id;
  console.log("userId", id);
  try {
    const data = await Withdraw.find({ userId: id });
    // console.log("Withdrawal data:", data);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

//products
app.get("/order/:id", async (req, res) => {
  const id = req.params.id;
  console.log("userId", id);
  try {
    const buyDatas = await BuysProducts.find({ userId: id });
    console.log("Withdrawal data:", buyDatas);
    res.json(buyDatas);
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

//Check-in
let userLastCheckIn = {}; // Store last check-in times for simplicity

// app.post("/order", async (req, res) => {
//   const userId = req.body.userId;

//   console.log("User ID:", userId);

//   if (!userId) {
//     return res.status(400).json({ message: "User ID is required" });
//   }

//   const now = new Date();
//   const lastCheckIn = new Date(userLastCheckIn[userId] || 0); // Default to epoch

//   const timeSinceLastCheckIn = now - lastCheckIn;
//   const oneDay = 24 * 60 * 60 * 1000;

//   if (timeSinceLastCheckIn < oneDay) {
//     console.log(`User ${userId} has already checked in today`);
//     return res
//       .status(200)
//       .json({ message: "Already checked in today", hasProducts: true });
//   }

//   try {
//     const orderData = await BuysProducts.find({ userId: userId });
//     const orderDataArray = orderData || [];

//     const wallet = await Wallet.findOne({ userId: userId });
//     const userHasProducts = orderDataArray.length > 0;

//     if (userHasProducts) {
//       userLastCheckIn[userId] = now;

//       // Calculate the total productDailyIncome from all orders
//       let totalDailyIncome = 0;
//       for (const order of orderDataArray) {
//         console.log("Order:", order.productDailyIncome); // Process each order as needed
//         totalDailyIncome += order.productDailyIncome;
//       }

//       // Add the totalDailyIncome to the remainingWalletAmount in walletData
//       if (wallet) {
//         wallet.remainingBalance += totalDailyIncome;
//         await wallet.save(); // Save the updated walletData to the database
//         console.log(`Wallet for user ${userId} updated successfully`);
//       } else {
//         console.log(`No wallet found for userId: ${userId}`);
//         return res.status(404).json({ message: "Wallet not found for user" });
//       }

//       return res
//         .status(200)
//         .json({ message: "Check-in complete", hasProducts: true });
//     } else {
//       return res
//         .status(200)
//         .json({ message: "You don't have any products", hasProducts: false });
//     }
//   } catch (error) {
//     console.error("Error processing order:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// });

// Listen on dynamically assigned port by Vercel
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
