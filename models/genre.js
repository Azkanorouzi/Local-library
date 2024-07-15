const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const genreSchema = new Schema({
  name: { type: String, require: true, minLength: 3, maxLength: 100 },
});

genreSchema.virtual("url").get(function () {
  return `/catalog/genre/${this._id}`;
});

module.exports = mongoose.model("genre", genreSchema);
