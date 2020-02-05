var logger = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var express = require("express");
var app = express();





var axios = require("axios");
var cheerio = require("cheerio");

// var Comment = require("../models/Comment.js");
// var Article = require("../models/Article.js");

app.use(logger("dev"));
// Parse request body as JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
// Make public a static folder


app.use(express.static(__dirname + "/public/"));
//Require set up handlebars
var exphbs = require("express-handlebars");
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    allowedProtoMethods:true,

  })
);
app.set("view engine", "handlebars");




var port = 3000;




var db = require("./models")

 


mongoose.connect("mongodb://localhost:27017/mongoscrape", {
  useNewUrlParser: true,
  useUnifiedTopology: true});

  
  // var routes = require("./controller/controller");
  // app.use("/", routes);


  

app.get("/", function(req, res) {
  res.redirect("/articles");
});


app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("http://www.theverge.com").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    var titlesArray = [];

    $(".c-entry-box--compact__title").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      if (result.title !== "" && result.link !== "") {
        if (titlesArray.indexOf(result.title) == -1) {
          titlesArray.push(result.title);

          db.Article.countDocuments({ title: result.title }, function(err, test) {
            if (test === 0) {
              var entry = new db.Article(result);

              entry.save(function(err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                  // console.log(result);
                }
              });
            }
          });
        } else {
          console.log("Article already exists.");
        }
      } else {
        console.log("Not saved to DB, missing data");
      }
    });
    
    res.redirect("/");
  });
});
  // Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  
  db.Article.findOne()
.sort({ _id: -1 })
.exec(function(err, doc) {
  if (err) {
    console.log(err);
  } else {
    
    var artcl = { article: doc };
  
    res.render("index", artcl);
  }
});
});
app.get("/clearAll", function(req, res) {
    db.Article.deleteMany({}, function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log("removed all articles");
      }
    });
    res.redirect("/articles");
  });

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/readarticles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  var articleId = req.params.id;
  var hbsObj = {
    article: [],
    body: []
  };
  
  db.Article.findOne({ _id: articleId })
  .populate("comment")
  .exec(function(err, doc) {
    if (err) {
      console.log("Error: " + err);
    } else {
      hbsObj.article = doc;
      var link = doc.link;
      axios(link, function(error, response, html) {
        var $ = cheerio.load(html);

        $(".l-col__main").each(function(i, element) {
          hbsObj.body = $(this)
            .children(".c-entry-content")
            .children("p")
            .text();
console.log("hbsObj", hbsObj)
          res.render("article", hbsObj);
          return false;
        });
      });
    }
  });
});

// Route for saving/updating an Article's associated Note
app.post("/comment/:id", function(req, res) {
  var user = req.body.name;
  var content = req.body.comment;
  var articleId = req.params.id;

  var commentObj = {
    name: user,
    body: content
  };

  var newComment = new Comment(commentObj);

  newComment.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id);
      console.log(articleId);

      db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comment: doc._id } },
        { new: true }
      ).exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          r
          res.redirect("/readArticle/" + articleId);
        }
      });
    }
  });
});


// app.get("/scrape", function(req, res) {
//   request("http://www.theverge.com", function(error, response, html) {
//     var $ = cheerio.load(html);
//     var titlesArray = [];

//     $(".c-entry-box--compact__title").each(function(i, element) {
//       var result = {};

//       result.title = $(this)
//         .children("a")
//         .text();
//       result.link = $(this)
//         .children("a")
//         .attr("href");

//       if (result.title !== "" && result.link !== "") {
//         if (titlesArray.indexOf(result.title) == -1) {
//           titlesArray.push(result.title);

//           db.Article.count({ title: result.title }, function(err, test) {
//             if (test === 0) {
//               var entry = new Article(result);

//               entry.save(function(err, doc) {
//                 if (err) {
//                   console.log(err);
//                 } else {
//                   console.log(doc);
//                 }
//               });
//             }
//           });
//         } else {
//           console.log("Article already exists.");
//         }
//       } else {
//         console.log("Not saved to DB, missing data");
//       }
//     });
//     res.redirect("/");
//   });
// });
// app.get("/articles", function(req, res) {
//   db.Article.find()
//     .sort({ _id: -1 })
//     .exec(function(err, doc) {
//       if (err) {
//         console.log(err);
//       } else {
//         var artcl = { article: doc };
//         res.render("index", artcl);
//       }
//     });
// });

// app.get("/articles-json", function(req, res) {
//   db.Article.find({}, function(err, doc) {
//     if (err) {
//       console.log(err);
//     } else {
//       res.json(doc);
//     }
//   });
// });

// app.get("/clearAll", function(req, res) {
//   db.Article.remove({}, function(err, doc) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log("removed all articles");
//     }
//   });
//   res.redirect("/articles-json");
// });

// app.get("/readArticle/:id", function(req, res) {
//   var articleId = req.params.id;
//   var hbsObj = {
//     article: [],
//     body: []
//   };

//   db.Article.findOne({ _id: articleId })
//     .populate("comment")
//     .exec(function(err, doc) {
//       if (err) {
//         console.log("Error: " + err);
//       } else {
//         hbsObj.article = doc;
//         var link = doc.link;
//         request(link, function(error, response, html) {
//           var $ = cheerio.load(html);

//           $(".l-col__main").each(function(i, element) {
//             hbsObj.body = $(this)
//               .children(".c-entry-content")
//               .children("p")
//               .text();

//             res.render("article", hbsObj);
//             return false;
//           });
//         });
//       }
//     });
// });
// app.post("/comment/:id", function(req, res) {
//   var user = req.body.name;
//   var content = req.body.comment;
//   var articleId = req.params.id;

//   var commentObj = {
//     name: user,
//     body: content
//   };

//   var newComment = new Comment(commentObj);

//   newComment.save(function(err, doc) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log(doc._id);
//       console.log(articleId);

//       Article.findOneAndUpdate(
//         { _id: req.params.id },
//         { $push: { comment: doc._id } },
//         { new: true }
//       ).exec(function(err, doc) {
//         if (err) {
//           console.log(err);
//         } else {
//           res.redirect("/readArticle/" + articleId);
//         }
//       });
//     }
//   });
// });

app.get("/", function(req, res) {
  res.redirect("/articles");
});

// Start the server
app.listen(port, function() {
    console.log("App running on port " + port + "!");
  });