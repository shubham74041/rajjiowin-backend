const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  User,
  Recharge,
  Wallet,
  Withdraw,
  BuyProduct,
  Referral,
  Contact,
} = require("./mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(cors());

app.use(
  cors({
    origin: "https://finance-king-pi.vercel.app", // Replace with your frontend's domain
    methods: "GET,POST", // Specify the allowed methods
    credentials: true, // Allow credentials if needed
  })
);

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

// Route imports
// const loginRoute = require("./routes/login.js");
// const signupRoute = require("./routes/signup.js");
// const referralRoute = require("./routes/referral.js");
// const rechargeRoute = require("./routes/recharge.js");
// const rechargeDataRoute = require("./routes/recharge-data.js");
// const orderRoute = require("./routes/order.js");
// const walletRoute = require("./routes/wallet.js");
// const withdrawalRoute = require("./routes/withdrawal.js");
// const withdrawDataRoute = require("./routes/withdraw-data.js");

// Use routes
// app.use("/login", loginRoute);
// app.use("/signup", signupRoute);
// app.use("/referral", referralRoute);
// app.use("/recharge", rechargeRoute);
// app.use("/recharge-data", rechargeDataRoute);
// app.use("/order", orderRoute);
// app.use("/", walletRoute);
// app.use("/withdrawal", withdrawalRoute);
// app.use("/withdraw-data", withdrawDataRoute);

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

//Signup endpoint
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

app.post("/referral", async (req, res) => {
  try {
    const { userId } = req.body;
    // console.log(userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if a referral code already exists for this user
    let referral = await Referral.findOne({ userId });

    if (!referral) {
      // Generate a unique referral code
      let referralCode = generateReferralCode();
      let existingReferral = await Referral.findOne({ referralCode });

      // Ensure the referral code is unique
      while (existingReferral) {
        referralCode = generateReferralCode();
        existingReferral = await Referral.findOne({ referralCode });
      }

      // Save the new referral code
      referral = new Referral({ userId, referralCode });
      await referral.save();
    }

    // Return the referral code to the user
    res.json({ referralCode: referral.referralCode });
  } catch (error) {
    console.error("Error generating referral code:", error);
    res.status(500).json({ message: "Failed to generate referral code" });
  }
});

const generateReferralCode = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

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
    console.log("Recharge Data:", data);
    res.json(data);
  } catch (err) {
    console.log("Error:", err);
  }
});

app.get("/recharge-data", async (req, res) => {
  try {
    const userData = await Recharge.find({});
    // console.log("User Data:", userData);
    res.json(userData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// get for admin

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
      const newBuy = await BuyProduct.create(buyData);
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

app.post("/check-in/:userId", async (req, res) => {
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
    const orderData = await BuyProduct.find({ userId: userId });
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

// recharge api

//withdrawal api
app.post("/withdrawal/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  console.log("userId", id);

  let newData = {};

  if (data.method === "bank") {
    newData = {
      userId: id,
      withdrawalAmount: data.withdrawalAmount,
      paymentMethod: data.method,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolderName: data.accountHolderName,
      IFSCCode: data.ifscCode,
    };
  } else if (data.method === "upi") {
    newData = {
      userId: id,
      withdrawalAmount: data.withdrawalAmount,
      paymentMethod: data.method,
      upiId: data.upiId,
    };
  } else {
    return res.status(400).send({ error: "Invalid payment method" });
  }

  try {
    const orderHistory = await BuyProduct.find({ userId: id });
    if (orderHistory.length === 0) {
      return res.status(400).send({ error: "No order history found for user" });
    }

    const newWithdrawal = await Withdraw.create(newData);
    console.log("Withdrawal data:", newWithdrawal);

    const walletData = await Wallet.findOne({ userId: id });
    if (!walletData) {
      return res.status(404).send({ error: "Wallet not found for user" });
    }

    if (walletData.remainingBalance < data.withdrawalAmount) {
      return res.status(400).send({ error: "Insufficient balance in wallet" });
    }

    const updateWallet = {
      userTotalAmount: walletData.userTotalAmount - data.withdrawalAmount,
      remainingBalance: walletData.remainingBalance - data.withdrawalAmount,
    };

    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId: id },
      updateWallet,
      { new: true }
    );
    console.log("Updated wallet data:", updatedWallet);

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

//WithdrawData
app.post("/withdraw-data/:id", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  console.log(action);
  console.log(id);

  try {
    // Find the document by id and update it
    const result = await Withdraw.findByIdAndUpdate(
      id,
      { paid: action },
      { new: true }
    );

    if (!result) {
      return res.status(404).send({ message: "Document not found" });
    }
    console.log(result);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

//products
app.get("/order/:id", async (req, res) => {
  const id = req.params.id;
  console.log("userId", id);
  try {
    const buyDatas = await BuyProduct.find({ userId: id });
    // console.log("Withdrawal data:", buyDatas);
    res.json(buyDatas);
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

app.get("/financial/:id", async (req, res) => {
  const id = req.params.id;
  console.log("userId:", id);
  try {
    const rechargeData = await Recharge.find({ userId: id });
    const withdrawData = await Withdraw.find({ userId: id });

    const results = [];

    rechargeData.forEach((recharge) => {
      results.push({
        type: "recharge",
        amount: recharge.rechargeAmount,
        paid: recharge.paid,
        date: recharge.createdAt,
      });
    });

    withdrawData.forEach((withdraw) => {
      results.push({
        type: "withdraw",
        amount: withdraw.withdrawalAmount,
        paid: withdraw.paid,
        date: withdraw.createdAt,
      });
    });

    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

//admin referral details

app.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("userId", id);

    const userData = await User.find({});
    if (!userData || userData.length === 0) {
      return res.status(404).json({ error: "Users not found" });
    }

    const results = [];

    for (const user of userData) {
      const userId = user.phoneNumber;
      const referralId = await Referral.findOne({ userId: userId });

      let referralCode = "";
      let referralCount = 0;

      if (referralId) {
        referralCode = referralId.referralCode;
        const referredUsers = await User.find({ referralCode: referralCode });
        // console.log("Referred users:", referredUsers);
        referralCount = referredUsers.length;
      } else {
        console.log(`Referral not found for userId: ${userId}`);
      }

      results.push({
        userId: user.phoneNumber,
        userPassword: user.password,
        referralId: referralCode,
        referralCount: referralCount,
        usedReferralCode: user.referralCode, // Add this line to include the referral code used by the user or a default message
      });
    }

    return res.json(results);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// admin user details
app.get("/details-referral/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const userDataList = await User.find({});
    if (!userDataList || userDataList.length === 0) {
      return res.status(404).json({ error: "Users not found" });
    }

    const results = await Promise.all(
      userDataList.map(async (userData) => {
        const referralId = await Referral.findOne({
          userId: userData.phoneNumber,
        });

        const orderDetail = await BuyProduct.find({
          userId: userData.phoneNumber,
        });
        const orderCount = orderDetail.length;

        let referralCode = referralId
          ? referralId.referralCode
          : "No referral code";

        return {
          userId: userData.phoneNumber,
          userPassword: userData.password,
          referralId: referralCode,
          orderCount: orderCount,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add amount

app.post("/users/:id", async (req, res) => {
  try {
    const { amount } = req.body;
    const id = req.params.id;
    console.log("userId", id);
    console.log(amount);

    const walletAmount = await Wallet.findOne({ userId: id });
    if (!walletAmount) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    console.log(walletAmount);

    const updateWallet = {
      userTotalAmount: walletAmount.userTotalAmount + amount,
      remainingBalance: walletAmount.remainingBalance + amount,
    };
    const data = await Wallet.findOneAndUpdate({ userId: id }, updateWallet, {
      new: true,
    });

    if (!data) {
      return res.status(500).json({ error: "Error updating wallet" });
    }

    console.log(data);
    res.json({ resMsg: "Amount added successfully" });
  } catch (error) {
    console.error("Error adding amount:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Contact
app.post("/contact/:id", async (req, res) => {
  const userId = req.params.id;
  const { name, email, subject, message } = req.body;
  // console.log(id);
  // console.log(data);

  const newContact = new Contact({
    userId,
    name,
    email,
    subject,
    message,
  });

  try {
    await newContact.save();
    console.log(newContact);
    res.send("Message received");
  } catch (err) {
    res.status(400).send(err.message);
  }
});

app.get("/messages/:id", async (req, res) => {
  try {
    const data = await Contact.find({});
    console.log(data);
    res.json(data);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "An error occurred while fetching messages." });
  }
});

// Listen on dynamically assigned port by Vercel
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
