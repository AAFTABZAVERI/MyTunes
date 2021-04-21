const mongoose = require("mongoose");
const DATABASE_NAME = 'mytunes-db';
const MONGOURI = `mongodb://127.0.0.1:27017/${DATABASE_NAME}`;

const InitiateMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
    console.log("Connected to DB !!");
  } catch (e) {
    console.log(e);
    throw e;
  }
};

module.exports = InitiateMongoServer;