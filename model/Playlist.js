const { ObjectID } = require("bson");
const mongoose = require("mongoose");
const PlaylistSchema = mongoose.Schema({
  name: {
      type: String,
      required: true
  },
  songsid:[ObjectID]
});

module.exports = mongoose.model("playlist",PlaylistSchema);
