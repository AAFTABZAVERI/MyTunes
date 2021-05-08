const { ObjectID } = require("bson");
const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: false
  },
  birthDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  playlist: [
    {
      id:ObjectID,
      name:String
    }
  ]

});

// export model user with UserSchema
module.exports = mongoose.model("user", UserSchema);