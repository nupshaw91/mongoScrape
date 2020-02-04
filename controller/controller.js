var express = require("express");
var router = express.Router();
var path = require("path");

var axios = require("axios");
var cheerio = require("cheerio");

var Comment = require("../models");
var Article = require("../models/article");

router.get("/", function (req, res) {
    res.redirect("/article");
    
});

router.get("/scrape", function (req, res) {
    axios.get("http:/www.nfl.com").then( function (response) {
        var $ = cheerio.load(response);
        var titleArray = [];

        $(".c-entry-box--compact__title").each(function (i, element) {
            var result = {};

            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");

            if (result.title !== "" && result.link !== "") {
                titleArrayArray.push(result.title);


                if (titleArray.indexOf(result.title) == -1) {
                    Article.count({ title: result.title }, function (err, test) {
                        if (test === 0) {
                            var entry = new Article(result);

                            entry.save(function (err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(doc);
                                }
                            
                            })
                }
            })

    }else {
        console.log("Article alread exists.");
    }
             }else {
    console.log("Not saved to DB, missing data");
}


        });
res.redirect("/");
    });
});


router.get("/articles", function(req,res){
    Article.find().sort({_id: -1}).exec(function(err, doc){
        if (err) {
            console.log(err);
        } else {
            var artcl = { article: doc };
            res.render("index", artcl);
        }
    });
});


router.get("/articles-json", function(req, res){
    Article.find({}, function(err, doc){
        if(err){
            console.log(err);
        } else{
            res.json(doc);
        }
    });
});

module.exports = router;