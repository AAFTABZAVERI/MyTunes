const mongoose = require("mongoose");
const DATABASE_NAME = 'mytunes-db';
const MONGOURI = `mongodb+srv://vishal:Vip@1234@cluster0.csvnv.mongodb.net/mytunes-db?retryWrites=true/mytunes-db`;

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false 
    });
    console.log("Connected to DB !!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = InitiateMongoServer;