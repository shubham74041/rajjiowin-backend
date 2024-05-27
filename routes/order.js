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

//products
router.get("/order/:id", async (req, res) => {
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

module.exports = router;
