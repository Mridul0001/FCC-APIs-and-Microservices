const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const shortid = require("shortid");
const cors = require("cors");

// const mongoose = require('mongoose')
// mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Using local database
let users = [];
let exercises = [];

//get username by id
const getUserNameById = id => users.find(user => user._id === id).username;

//get exercises with id
const getExercisesFromUserWithId = id => exercises.filter(ex => ex._id === id);
//adding users
app.post("/api/exercise/new-user", (req, res) => {
  const { username } = req.body;

  const newUser = {
    username,
    _id: shortid.generate()
  };

  users.push(newUser);
  res.json(newUser);
});

//get all users
app.get("/api/exercise/users", (req, res) => {
  res.json(users);
});

//add exercises
app.post("/api/exercise/add", (req, res) => {
  const { userId, description, duration, date } = req.body;
  //assuming that passed date is valid
  const dateObj = date === "" ? new Date() : new Date(date);

  const newExercise = {
    _id: userId,
    username: getUserNameById(userId),
    date: dateObj.toString().slice(0, 15),
    duration: +duration,
    description
  };

  exercises.push(newExercise);

  res.json(newExercise);
});

//get logs
app.get("/api/exercise/log", (req, res) => {
  const { userId, from, to, limit } = req.query;

  let log = getExercisesFromUserWithId(userId);
  let logs;
  let fromDate;
  let toDate;

  logs = {
    userId: userId,
    username: getUserNameById(userId),
    count: log.length,
    log
  };

  if (limit) {
    log = log.slice(0, +limit);
    logs = {
      userId: userId,
      username: getUserNameById(userId),
      count: log.length,
      log
    };
  }

  if (from) {
    fromDate = new Date(from);
    log = log.filter(exe => new Date(exe.date) >= fromDate);
    logs = {
      userId: userId,
      username: getUserNameById(userId),
      from: fromDate.toString().slice(0, 15),
      count: log.length,
      log
    };
  }

  if (to) {
    toDate = new Date(to);
    log = log.filter(exe => new Date(exe.date) <= toDate);
    logs = {
      userId: userId,
      username: getUserNameById(userId),
      from: fromDate.toString().slice(0, 15),
      to: toDate.toString().slice(0, 15),
      count: log.length,
      log
    };
  }

  res.json(logs);
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
