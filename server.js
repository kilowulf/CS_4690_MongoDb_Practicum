const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();

// server port
const port = 3000;

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  next();
});

// host api
app.use(express.static("public"));
// parse json files
app.use(express.json());

// Define schemas for logs and courses
const Logs = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    courseId: { type: String, required: true },
    uvuId: { type: String, required: true },
    date: { type: Date, required: true },
    text: { type: String, required: true },
    id: { type: String, required: true, unique: true }
  },
  { collection: "logs", versionKey: false }
);

const Courses = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true },
    id: { type: String, required: true, unique: true },
    display: { type: String, required: true }
  },
  { collection: "courses" }
);

// Create the models for the schemas:
const LogModel = mongoose.model("logs", Logs);
const CourseModel = mongoose.model("courses", Courses);

// connect to MongoDB database
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env
      .DB_PASSWORD}@classlogsdb.frupsq3.mongodb.net/${process.env
      .DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(conn => {
    console.log(
      `Connected to MongoDB on ${conn.connection.host}:${conn.connection.port}`
    );
  })
  .catch(err => console.error("Error connecting to MongoDB", err));

// get courses array
app.get("/api/v1/courses", async (req, res) => {
  const courses = await CourseModel.find();
  res.json(courses);
});

// get logs array
app.get("/api/v1/logs", async (req, res) => {
  const logs = await LogModel.find().populate("courseId");
  res.json(logs);
});

// get record that matches courseId and uvuId
app.get("/api/v1/logs/:courseId/:uvuId", async (req, res) => {
  const { courseId, uvuId } = req.params;
  const logs = await LogModel.find({ courseId, uvuId }).populate("courseId");
  if (logs.length === 0) {
    return res.status(404).send("Logs not found");
  }
  res.send(logs);
});

// add new entry to logs array
app.post("/api/v1/logs", async (req, res) => {
  const newLog = new LogModel({
    _id: new mongoose.Types.ObjectId(),
    courseId: req.body.courseId,
    uvuId: req.body.uvuId,
    date: req.body.date,
    text: req.body.text,
    id: req.body.id
  });
  await newLog.save();
  res.send("Log added successfully");
});

// update record matching id within logs array
app.put("/api/v1/logs/:id", async (req, res) => {
  const { courseId, uvuId, date, text } = req.body;
  const log = await LogModel.findOne({ id: req.params.id }).populate(
    "courseId"
  );
  if (!log) {
    return res.status(404).send("Log not found");
  }
  log.courseId = courseId;
  log.uvuId = uvuId;
  const logDate = new Date(log.date);
  const formattedDate = logDate.toLocaleString("en-US", {
    dateStyle: "short",
    timeStyle: "medium"
  });
  log.date = formattedDate;
  log.text = text;
  log.id = req.params.id;
  await log.save();
  res.json(log);
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
// Close the server when the process is terminated
process.on("SIGINT", () => {
  console.log("Closing server...");

  // Close the server and handle any errors that occur
  server.close(err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log("Server closed.");
    process.exit(0);
  });
});
