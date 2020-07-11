"use strict";

const express = require("express");
const cors = require("cors");
const bodyParse = require("body-parser");
const multer = require("multer");

// require and use "multer"...
// SET STORAGE
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  }
});

var upload = multer({ storage: storage });
var app = express();

app.use(cors());
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.get("/hello", function(req, res) {
  res.json({ greetings: "Hello, API" });
});

//handling file upload with multer
app.post("/api/fileanalyse", upload.single("upfile"), (req, res, next) => {
  let file = req.file;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  const fileInfo = { name: file.originalname, 
                    type: file.mimetype, 
                    size: file.size };
  res.json(fileInfo);
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Node.js listening ...");
});
