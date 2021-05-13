const mongoose = require("mongoose");
const DATABASE_NAME = 'mytunes-db';
const MONGOURI = `mongodb://localhost:27017/${DATABASE_NAME}`;

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