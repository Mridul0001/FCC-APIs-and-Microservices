"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var dns = require("dns");
var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var Schema = mongoose.Schema;

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.urlencoded({ extended: false }));

//Database schema
var urlSchema = new Schema({
  originalUrl: String,
  shortUrl: String
});

var URL_DB = mongoose.model("URL_DB", urlSchema);

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// your first API endpoint...
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

//shortening url
app.post(
  "/api/shorturl/new",
   function(req, res, next) {
    let originalUrl = req.body.url;
    originalUrl = originalUrl.slice(originalUrl.indexOf("//") + 2);
    let index = originalUrl.indexOf("/");
    originalUrl = index > 0 ? originalUrl.slice(0, index) : originalUrl;
    dns.lookup(originalUrl, (err, data) => {
      if (err) return res.send({ error: "invalid URL" });
      //if url is valid then pass it to next function
      next();
    });
  },
  async function(req, res) {
    //add original and shor url to database
    let originalUrl = req.body.url;
    let shortUrl = 
          Math.random()
            .toString(32)
            .substring(2, 5) +
          Math.random()
            .toString(32)
            .substring(2, 5);;
    let response = null;
    //find url in database and await for response
    let data = await URL_DB.find({ originalUrl: originalUrl }, async (err, data) => {
      //if any error occurs
      if (err) return console.log(err);
      return data;
    });
      //check if url is present or not
      if (data.length == 0) {
        // not present

        //create new database document object
        response =  { original_url: originalUrl, short_url: shortUrl };
        let url = new URL_DB({
          originalUrl: originalUrl,
          shortUrl: shortUrl
        });
        //add to database
        url.save((err, data) => {
          if (err) return console.log(err);
          return data;
        });
      } else {
        //if url is present
        response = {
          original_url: data[0].originalUrl,
          short_url: data[0].shortUrl
        };
      }
    console.log(response);
    res.send(response);
  }
);

//redirect back to original using short url
app.get("/api/shorturl/:shu", async function(req, res, next){
  let shortUrl = (req.params.shu).toString();
  //find url in database and await for response
    let data = await URL_DB.find({ shortUrl: shortUrl }, async (err, data) => {
      //if any error occurs
      if (err) return console.log(err);
      return data;
    });
  
  //check if url is present or not
  if(data.length == 0){ //not present
    next();
  }else{   //present
    let originalUrl = data[0].originalUrl;
    console.log(originalUrl);
    res.redirect(originalUrl)
  }
}, function(req, res){
  res.sendStatus(404);
})

app.listen(port, function() {
  console.log("Node.js listening ...");
});
