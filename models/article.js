var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var articleSchema= new Schema({
    title: {
        type: String,
        required: true
      },
      link: {
        type: String,
        required: true
      },
      note: {
        type: Schema.Types.ObjectId,
        ref: "news"
      }
});

var article = mongoose.model("Article", articleSchema);

module.exports = article;