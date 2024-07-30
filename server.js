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
  Popup,
  Products,
  ReferralAmount,
  CheckInAmount,
  Admin,
} = require("./mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json()); // Body parser for JSON payloads
app.use((req, res, next) => {
  console.log("Request origin:", req.get('origin'));
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "https://rajjowin.in",
        "https://www.rajjowin.in",
        "http://localhost:3000",
        "http://rajjowin.in",
        "http://www.rajjowin.in",
      ];
      console.log("CORS Origin:", origin);
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "*",
    credentials: true,
  })
);
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       const allowedOrigins = [
//         "https://rajjowin.in",
//         "https://www.rajjowin.in",
//         "http://localhost:3000",
//         "http://rajjowin.in",
//         "http://www.rajjowin.in",

//       ];
//       if (allowedOrigins.includes(origin) || !origin) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true,
//   })
// );

// Middleware to log request origin
app.use((req, res, next) => {
  console.log("Request origin:", req.headers.origin);
  next();
});
app.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username, password });
  if (admin) {
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
});
// admin change password
app.post("/change-password", async (req, res) => {
  const { username, passkey, newPassword } = req.body;

  try {
    if (passkey !== process.env.ADMIN_PASSKEY) {
      return res
        .status(400)
        .json({ success: false, message: "Passkey not match" });
    }

    // Find the admin by username or any unique identifier you use
    const admin = await Admin.findOne({ username }); // Replace 'admin' with your admin identifier logic

    if (!admin) {
      return res
        .status(400)
        .json({ success: false, message: "Admin not found" });
    }

    // Update the password

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
});

app.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body;

  try {
    const user = await User.findOne({ phoneNumber: phoneNumber });
    if (!user) {
      // User does not exist
      return res.status(401).json({ message: "User not found" });
    }

    if (user.password === password) {
      // Successful login
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

    await User.create({ email, phoneNumber, password, referralCode });
    res.json("notexists");
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});
//edit password
app.post("/password/:id", async (req, res) => {
  const { newPassword } = req.body;
  const { id } = req.params;
  console.log(newPassword, id);
  try {
    const updatePassword = await User.findOneAndUpdate(
      { phoneNumber: id },
      { password: newPassword },
      { new: true }
    );
    // console.log(updatePassword);
    res.json({ resMsg: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal server error");
  }
});

// Account Delete
app.post("/delete-account/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteAccount = await User.findOneAndDelete({ phoneNumber: id });
    const deleteReferral = await Referral.findOneAndDelete({ userId: id });
    const deleteRecharge = await Recharge.deleteMany({ userId: id });
    const deleteRechargeData = await BuyProduct.deleteMany({
      userId: id,
    });
    const deleteWithdraw = await Withdraw.deleteMany({ userId: id });
    const deleteWithdrawData = await Contact.deleteMany({ userId: id });
    const deleteWallet = await Wallet.findOneAndDelete({ userId: id });
    const deleteReferralAmount = await ReferralAmount.findOneAndDelete({
      userId: id,
    });
    const deleteCheckInAmount = await CheckInAmount.deleteMany({ userId: id });

    res.json({ resMsg: "Account deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json("Internal server error");
  }
});

//referral
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
      { paid: paid, disabled: true, status: paid ? "paid" : "cancel" }, // Set disabled to true
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

    res.status(200).send("Data updated successfully");
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).send("Internal server error");
  }
});

//Edit Products
app.get("/new-product", async (req, res) => {
  try {
    const productData = await Products.find({});
    res.json(productData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//Edit Route
app.post("/new-product/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  // console.log(id);
  // console.log(updatedData);

  try {
    const updatedProduct = await Products.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedProduct) {
      return res.status(404).send({ message: "Product not found" });
    }

    res.send({
      message: "Product updated successfully!",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).send({ message: "Error updating product", error });
  }
});

//custom popup

// POST route for handling custom popup data
app.post("/custom-popup", async (req, res) => {
  const { title, message, timePeriod } = req.body;

  try {
    // Update or insert the data
    const result = await Popup.updateMany(
      {},
      { title, message, timePeriod },
      { upsert: true }
    );

    if (result.length > 0) {
      console.log(`New popup created with title '${title}'`);
      res.status(201).send("New popup created");
    } else {
      console.log(`Popup updated with title '${title}'`);
      res.status(200).send("Popup updated successfully");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal server error");
  }
});

// GET call for wallet data
// app.get("/:id", async (req, res) => {
//   const userId = req.params.id;

//   try {
//     const data = await Wallet.findOne({ userId: userId });
//     if (!data) {
//       // If no wallet data is found for the provided userId, send a 404 response
//       return res.status(404).json({ error: "Wallet data not found" });
//     }
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching wallet data:", error);
//     res.status(500).json({ error: "Internal server error" }); // Send an error response if something goes wrong
//   }
// });

// api call for wallet data

// Endpoint to fetch check-in status
app.get("/check-in/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const latestPurchase = await BuyProduct.findOne({ userId }).sort({
      createdAt: -1,
    });
    if (!latestPurchase) {
      return res.status(404).json({ message: "No purchase found for user" });
    }

    const user = await User.findOne({ phoneNumber: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const lastCheckIn = user.lastCheckIn || null;
    res
      .status(200)
      .json({ checkInStatus: latestPurchase.checkInStatus, lastCheckIn });
  } catch (error) {
    console.error("Error fetching check-in status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Purchase endpoint
app.post("/:userId", async (req, res) => {
  const userId = req.params.userId;
  const { price, cardData } = req.body;

  const buyData = {
    userId: userId,
    productTitle: cardData.title,
    productPrice: cardData.price,
    productDailyIncome: cardData.dailyIncome,
    productTotalAmount: cardData.totalAmount,
    productCycle: cardData.cycle,
    checkInStatus: true, // Set checkInStatus to true after purchase
  };

  try {
    if (cardData.title === "Plan A") {
      const existingPurchase = await BuyProduct.findOne({
        userId: userId,
        productTitle: cardData.title,
      });
      if (existingPurchase) {
        return res.json({ msg: "You have already purchased Plan A." });
      }
    }

    const walletData = await Wallet.findOne({ userId: userId });
    if (walletData.remainingBalance >= price) {
      const restBalance = walletData.remainingBalance - parseFloat(price);
      const updatedWallet = {
        remainingBalance: parseFloat(restBalance),
        purchasingAmount: parseFloat(price),
        totalPurchasingAmount:
          walletData.totalPurchasingAmount + parseFloat(price),
      };

      await Wallet.findByIdAndUpdate(walletData._id, updatedWallet, {
        new: true,
      });
      await BuyProduct.create(buyData);

      res.json({
        msg: "Product purchased successfully!",
        walletBalance: restBalance,
      });
    } else {
      res.json({ msg: "Insufficient funds! Please recharge your wallet." });
    }
  } catch (error) {
    console.error("Error processing purchase:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/check-in/:userId", async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const user = await User.findOne({ phoneNumber: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orderData = await BuyProduct.find({ userId: userId }).sort({
      createdAt: -1,
    });
    const wallet = await Wallet.findOne({ userId: userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found for user" });
    }

    if (!orderData.length) {
      return res.status(200).json({
        message: "You don't have any products",
        hasProducts: false,
      });
    }

    const currentPurchase = orderData[0];
    const lastCheckIn = new Date(user.lastCheckIn || 0);
    const now = new Date();
    // const isNewDay = now.toDateString() !== lastCheckIn.toDateString();
    // Ensure time zones are the same
    const isNewDay =
      now.toLocaleDateString() !== lastCheckIn.toLocaleDateString();
    console.log("Current time ", now.toLocaleDateString());
    console.log("Last check-in time ", lastCheckIn.toLocaleDateString());

    // console.log("User:", user);
    // console.log("Last check-in date:", lastCheckIn);
    // console.log("Current date:", now);
    // console.log("Is new day:", isNewDay);

    const daysSincePurchase = Math.floor(
      (now - currentPurchase.createdAt) / (1000 * 60 * 60 * 24)
    );
    const productCycle = parseInt(currentPurchase.productCycle);

    // Check if it's a new day
    if (isNewDay) {
      let totalDailyIncome = 0;

      for (const order of orderData) {
        const daysSincePurchase = Math.floor(
          (now - order.createdAt) / (1000 * 60 * 60 * 24)
        );
        const productCycle = parseInt(order.productCycle);

        if (daysSincePurchase <= productCycle) {
          totalDailyIncome += order.productDailyIncome;
          order.checkInStatus = false; // Set checkInStatus to false for all products within cycle
          await order.save();
        }
      }

      if (totalDailyIncome > 0) {
        wallet.remainingBalance += totalDailyIncome;
        user.lastCheckIn = now;

        await wallet.save();
        await user.save();

        await CheckInAmount.create({
          userId: userId,
          totalCheckInAmount: totalDailyIncome,
          newCheckInAmount: totalDailyIncome,
          checkInDone: true,
        });

        return res.status(200).json({
          message: "Daily check-in complete",
          hasProducts: true,
          walletBalance: wallet.remainingBalance,
        });
      } else {
        return res.status(200).json({
          message: "No products are eligible for check-in today",
          hasProducts: true,
          walletBalance: wallet.remainingBalance,
        });
      }
    } else if (
      now.toDateString() === currentPurchase.createdAt.toDateString() &&
      currentPurchase.createdAt > lastCheckIn
    ) {
      if (daysSincePurchase <= productCycle) {
        wallet.remainingBalance += currentPurchase.productDailyIncome;
        user.lastCheckIn = now;

        currentPurchase.checkInStatus = false; // Set checkInStatus to false after check-in
        await wallet.save();
        await currentPurchase.save();
        await user.save();

        await CheckInAmount.create({
          userId: userId,
          totalCheckInAmount: currentPurchase.productDailyIncome,
          newCheckInAmount: currentPurchase.productDailyIncome,
          checkInDone: true,
        });

        return res.status(200).json({
          message: "Current purchase check-in complete",
          hasProducts: true,
          walletBalance: wallet.remainingBalance,
        });
      } else {
        return res.status(200).json({
          message: "Check-in cycle for this product is completed",
          hasProducts: true,
          walletBalance: wallet.remainingBalance,
        });
      }
    } else {
      return res.status(200).json({
        message: "Already checked in today",
        hasProducts: true,
        walletBalance: wallet.remainingBalance,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

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

    const walletData = await Wallet.findOne({ userId: id });
    if (!walletData) {
      return res.status(404).send({ error: "Wallet not found for user" });
    }

    if (walletData.remainingBalance < data.withdrawalAmount) {
      return res.status(400).send({ error: "Insufficient balance in wallet" });
    }

    const newWithdrawal = await Withdraw.create(newData);
    console.log("Withdrawal data:", newWithdrawal);

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
    const data = await Withdraw.find({});
    // console.log("Withdrawal data:", data);
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});

//WithdrawData
// Update withdrawal data with action
app.post("/withdraw-data/:id", async (req, res) => {
  const { id } = req.params;
  const { action, amount, userId } = req.body;
  console.log("Action:", action);
  console.log("ID:", id);
  console.log("Withdraw amount:", amount);

  try {
    if (action === false) {
      const wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        return res.status(404).send({ message: "Wallet not found" });
      }
      const updatedBalance = wallet.remainingBalance + amount;
      if (isNaN(updatedBalance)) {
        return res.status(400).send({ message: "Invalid remaining balance" });
      }

      await Wallet.findByIdAndUpdate(
        wallet._id,
        { remainingBalance: updatedBalance },
        { new: true }
      );
    }

    //status update

    const result = await Withdraw.findByIdAndUpdate(
      id,
      {
        paid: action,
        disabled: true,
        status: action ? "paid" : "cancel",
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).send({ message: "Document not found" });
    }

    res.send(result);
  } catch (error) {
    console.error(error);
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
    const ReferralData = await ReferralAmount.find({ userId: id });
    const CheckInData = await CheckInAmount.find({ userId: id });

    const results = [];

    rechargeData.forEach((recharge) => {
      results.push({
        type: "recharge",
        amount: recharge.rechargeAmount,
        paid: recharge.paid,
        status: recharge.status,
        date: recharge.createdAt,
      });
    });

    withdrawData.forEach((withdraw) => {
      results.push({
        type: "withdraw",
        amount: withdraw.withdrawalAmount,
        paid: withdraw.paid,
        status: withdraw.status,
        date: withdraw.createdAt,
      });
    });

    ReferralData.forEach((refer) => {
      results.push({
        type: "other",
        amount: refer.newAmount,
        paid: refer.value,
        date: refer.createdAt,
      });
    });

    CheckInData.forEach((checkin) => {
      results.push({
        type: "other",
        anotherType: "checkIn",
        amount: checkin.newCheckInAmount,
        checkIn: checkin.checkInDone,
        date: checkin.createdAt,
      });
    });

    res.json(results);
  } catch (err) {
    console.log(err);
    res.status(500).json("Internal server error");
  }
});


app.get("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 10;
    const search = req.query.search || "";

    const userData = await User.find({
      $or: [
        { phoneNumber: { $regex: search, $options: "i" } },
        { referralId: { $regex: search, $options: "i" } },
      ],
    });

    if (!userData || userData.length === 0) {
      return res.status(404).json({ error: "Users not found" });
    }

    const totalItems = userData.length;
    const paginatedData = userData.slice((page - 1) * size, page * size);

    const results = await Promise.all(
      paginatedData.map(async (user) => {
        const userId = user.phoneNumber;

        const referralPromise = Referral.findOne({ userId: userId });
        const referralAmountPromise = ReferralAmount.findOne({
          userId: userId,
        });
        const orderDetailPromise = BuyProduct.find({ userId: userId });

        const [referralId, referralAmount, orderDetail] = await Promise.all([
          referralPromise,
          referralAmountPromise,
          orderDetailPromise,
        ]);

        let referralCode = "";
        let referralCount = 0;
        let referralValue = 0;

        if (referralId) {
          referralCode = referralId.referralCode;
          const referredUsers = await User.find({ referralCode: referralCode });
          referralCount = referredUsers.length;
        }

        const orderCount = orderDetail.length;

        if (referralAmount) {
          referralValue = referralAmount.referralAmount;
        }

        return {
          userId: user.phoneNumber,
          userPassword: user.password,
          referralId: referralCode,
          referralCount: referralCount,
          referralValue: referralValue,
          usedReferralCode: user.referralCode,
          orderCount: orderCount,
        };
      })
    );

    return res.json({ users: results, totalItems });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// admin user details

app.get("/details-referral/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 10;
    const search = req.query.search || "";

    const userDataList = await User.find({
      $or: [
        { phoneNumber: { $regex: search, $options: "i" } },
        { referralId: { $regex: search, $options: "i" } },
      ],
    });

    if (!userDataList || userDataList.length === 0) {
      return res.status(404).json({ error: "Users not found" });
    }

    const totalItems = userDataList.length;
    const paginatedData = userDataList.slice((page - 1) * size, page * size);

    const results = await Promise.all(
      paginatedData.map(async (userData) => {
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

    res.json({ referrals: results, totalItems });
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

    // console.log(walletAmount);

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
    // Add or update referral data
    const referralData = await ReferralAmount.findOne({ userId: id });

    if (referralData) {
      // Update existing referral data
      referralData.newAmount = amount;
      referralData.referralAmount += amount;
      referralData.value = true;

      await referralData.save();
    } else {
      // Create new referral data
      const referralData = new ReferralAmount({
        userId: id,
        newAmount: amount,
        referralAmount: amount,
        value: true,
      });
      await referralData.save();
    }
    // console.log("referral ", referralData);
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

//Referral Show
app.get("/referral/:id", async (req, res) => {
  const userId = req.params.id;
  console.log("Received GET /referral/:id with userId:", userId);

  try {
    const referralAmountData = await ReferralAmount.findOne({ userId });
    if (!referralAmountData) {
      console.warn(`ReferralAmount data not found for userId: ${userId}`);
    }

    const referral = await Referral.findOne({ userId });
    if (!referral) {
      console.warn(`Referral data not found for userId: ${userId}`);
    }

    if (referral) {
      const referralCode = referral.referralCode;
      const referralUsers = await User.find({ referralCode });
      const referralCount = referralUsers.length;

      const results = {
        count: referralCount || 0,
        totalReferralAmount:
          (referralAmountData && referralAmountData.referralAmount) || 0,
        lastAmount: (referralAmountData && referralAmountData.newAmount) || 0,
      };

      res.json(results);
    } else {
      res.status(404).json({
        error: "Referral data not found for the user.",
      });
    }
  } catch (err) {
    console.error("Error fetching referral data:", err);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

//Popup
app.get("/check", async (req, res) => {
  try {
    // const data = await Popup.find({});
    console.log("all good ====////");
    res.json("all good ====////");
  } catch (err) {
    console.log("error",err);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

// Getting All Cards
app.get("/:userId/purchasedPlans", async (req, res) => {
  try {
    const { userId } = req.params;
    const userRecords = await BuyProduct.find({ userId });

    // Collect all purchased plans from the user records
    const purchasedPlans = userRecords.map((record) => ({
      productTitle: record.productTitle,
    }));

    let products = await Products.find({});

    // Sort products by plan name (e.g., "Plan A" to "Plan F")
    products = products.sort((a, b) => a.title.localeCompare(b.title));

    // console.log(products);

    res.json({
      purchasedPlans,
      cards: products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred while fetching data." });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});