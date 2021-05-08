const { ObjectID } = require("bson");
const mongoose = require("mongoose");

const SongsSchema = mongoose.Schema({
 name: {
     type: String,
     required: true
 },
 previewurl: {
     type: String,
     required:true 
 }

});

module.exports = mongoose.model("Songs",SongsSchema);