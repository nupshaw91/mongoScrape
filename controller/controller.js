var express = require("express");
var router = express.Router();
var path = require("path");



var axios = require("axios");
var request = require("request");
var cheerio = require("cheerio");

var Comment = require("../models/comment.js");
var Article = require("../models/article.js");


router.get("/", function (req, res) {
    res.redirect("/articles");
});


router.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.theverge.com").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);
        var titlesArray = [];

        $(".c-entry-box--compact__title").each(function (i, element) {
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

                    Article.countDocuments({ title: result.title }, function (err, test) {
                        if (test === 0) {
                            var entry = new Article(result);

                            entry.save(function (err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("saved docs",doc);
                                    
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
router.get("/articles", function (req, res) {
    
    Article.find()
        .sort({ _id: -1 })
        .exec(function (err, doc) {
            if (err) {
                console.log(err);
            } else {

                var artcl = { article: doc };
                res.render("index", artcl);
            }
        });
});

router.get("/articles-json", function(req, res) {
    Article.find({}, function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        res.json(doc);
      }
    });
  });

router.get("/clearAll", function (req, res) {
    Article.deleteMany({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log("removed all articles");
        }
    });
    res.redirect("/articles");
});

// Route for grabbing a specific Article by id, populate it with it's note
router.get("/readArticle/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    var articleId = req.params.id;
    var hbsObj = {
        article: [],
        body: []
    };

    Article.findOne({ _id: articleId })
        .populate("Comment")
        .exec(function (err, doc) {
            if (err) {
                console.log("Error: " + err);
            } else {
                hbsObj.article = doc;
                var link = doc.link;

                request(link, function(error, response, html)  {
                
                    
                    var $ = cheerio.load(html);
                    

                    $(".l-col__main").each(function (i, element) {
                        hbsObj.body = $(this)
                            .children(".c-entry-content")
                            .children("p")
                            .text();

                        res.render("article", hbsObj);
                        return false;
                    });
        
                });
        // console.log(link)
            }
        });
});

// Route for saving/updating an Article's associated Note
router.post("/comment/:id", function (req, res) {
    var user = req.body.name;
    var content = req.body.comment;
    var articleId = req.params.id;

    var commentObj = {
        name: user,
        body: content
    };

    var newComment = new Comment(commentObj);

    newComment.save(function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log(doc._id);
            console.log(articleId);

            Article.findOneAndUpdate(
                { _id: req.params.id },
                { $push: { comment: doc._id } },
                { new: true }
            ).exec(function (err, doc) {
                if (err) {
                    console.log(err);
                } else {

                    res.redirect("/readArticle/" + articleId);
                }
            });
        }
    });
});

module.exports = router;

