const mongoose = require("mongoose");
const initData = require("../AdminData/data.js");
const { Admin } = require("../../mongo.js");

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

const initDB = async () => {
  await Admin.insertMany(initData.admin);
  console.log("Admin Created");
};

initDB();
