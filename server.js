var logger = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var express = require("express");
var app = express();
var router = express.Router();

// Make public a static folder
app.use(express.static(__dirname + "/public/"));




app.use(logger("dev"));
// Parse request body as JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());




//Require set up handlebars
var exphbs = require("express-handlebars");
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    allowedProtoMethods:true,
    allowedProtoProperties:true,

  })
);
app.set("view engine", "handlebars");




let PORT = process.env.PORT || 3000;



mongoose.connect(process.env.MONGODB_URI ||"mongodb://0.0.0.0/mongoscrape", {
  useNewUrlParser: true,
  useUnifiedTopology: true,});

  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open",function(){
    console.log("connected to mongoose");
  });


  var routes = require("./controller/controller");
  app.use("/", routes);

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });