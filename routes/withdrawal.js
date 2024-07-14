const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = express.Router();
const { Withdraw } = require("../mongo.js");

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

//withdrawal api
router.post("/withdrawal/:id", async (req, res) => {
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

module.exports = router;
