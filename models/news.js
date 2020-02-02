var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var newsSchema = new Schema({
    title: String,
    body: String
});

var news = mongoose.model("news", newsSchema);

module.exports =news;