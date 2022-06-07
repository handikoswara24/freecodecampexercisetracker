const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

var mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const { Schema } = mongoose;

const usernameSchema = new Schema({
  username: {
    type: String
  }
})

const exerciseSchema = new Schema({
  username: {
    type: String
  },
  description: {
    type: String
  },
  duration: {
    type: Number
  },
  date: {
    type: Date
  },
  userId: {
    type: String
  }
})

let User = mongoose.model("User", usernameSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", async (req, res) => {
  const username1 = new User({ username: req.body.username });

  const userCreate = await username1.save();

  res.json({
    username: userCreate.username,
    _id: userCreate._id
  })
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  const description = req.body.description;
  const duration = Number(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  const id = req.params._id;

  const user = await User.findById(id);

  const username = user.username;

  const exercise = new Exercise({
    username,
    description,
    duration,
    date: date,
    userId: user._id
  })

  await exercise.save();

  res.json({
    _id: id,
    username,
    description,
    duration,
    date: exercise.date.toDateString()
  })
})

app.get("/api/users", async (req, res) => {
  const users = await User.find();
  const result = users.map(u => {
    return {
      _id: u._id,
      username: u.username
    }
  })

  res.json(result);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const {from, to, limit} = req.query;
  const id = req.params._id;
  // const from = req.query.from;
  // const to = req.query.to;
  // const limitQuery = +req.query.limit;
  const user = await User.findById(id);

  let query = {
    username: user.username
  };

  // if(from && to){
  //   query.date = {
  //     $gte: new Date(from), 
  //     $lt: new Date(to)
  //   }
  // }

  let exercise = await Exercise.find(query);

  if ((req.query.from) && (req.query.to)) {
    exercise = exercise.filter((d) => ((d.date) >= Date.parse(req.query.from)) && ((d.date) <= Date.parse(req.query.to)));
  }
  // if(limitQuery){
  //   exercise = await Exercise.find(query).limit(Number(limitQuery));
  // }
  // else{
  //   exercise = await Exercise.find(query);
  // }

  // let exerciseLimit = [...exercise];

  // if(limitQuery){
  //   exerciseLimit = exerciseLimit.splice(0, Number(limitQuery));
  // }
  if (limit) {
    exercise = exercise.slice(0, Number(limit));
  }
  const exerciseMap = exercise.map(e => {
    return {
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }
  })
  res.json({
    username: user.username,
    count: exercise.length,
    _id: user._id,
    log: exerciseMap
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
