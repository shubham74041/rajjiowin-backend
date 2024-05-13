const express = require("express");
const cors = require("cors");
const { User, Recharge, Wallet } = require("./mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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

// Signup endpoint
app.post("/signup", async (req, res) => {
  const { email, phoneNumber, password } = req.body;

  try {
    const isExist = await User.findOne({ phoneNumber: phoneNumber });
    if (isExist) {
      res.json("exists");
      return;
    }
    // Create new user
    await User.create({ email, phoneNumber, password });
    res.json("notexists");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

//

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
  const { price } = req.body;
  console.log(userId);

  try {
    // Assuming Wallet is your Mongoose model
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

      // Use the document _id for findByIdAndUpdate
      const newData = await Wallet.findByIdAndUpdate(
        walletData._id, // Use _id field as the document ID
        updatedWallet,
        { new: true } // Return the updated document
      );
      console.log("new Data", newData);

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

// Listen on dynamically assigned port by Vercel
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
