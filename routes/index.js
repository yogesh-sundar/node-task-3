var express = require("express");
var router = express.Router();
const { dbUrl, mongodb, MongoClient } = require("../dbConfig");

//adding mentor to the db

router.post("/add-mentors", async (req, res) => {
  const client = await MongoClient.connect(dbUrl);
  try {
    const db = await client.db("mentorStudent");
    const user = await db.collection("mentor").insertOne(req.body);

    if (req.body.assignedStudents) {
      req.body.assignedStudents.map(async (students) => {
        const student = await db
          .collection("student")
          .updateOne(
            { studentName: students },
            { $set: { mentorName: req.body.mentorName } }
          );
      });
    }

    res.send({
      messge: "Mentor added to the DB",
    });
  } catch (error) {
    console.log(error);
    res.send({ message: "Error in DB" });
  } finally {
    client.close();
  }
});

//adding student to the DB

router.post("/add-students", async (req, res) => {
  const client = await MongoClient.connect(dbUrl);
  try {
    const db = client.db("mentorStudent");
    const user = await db.collection("student").insertOne(req.body);
    if (req.body.mentorName) {
      const mentor = await db
        .collection("mentor")
        .findOne({ "mentorName": req.body.mentorName });
      mentor.assignedStudents.push(req.body.studentName);

      const mentorUpdate = await db
        .collection("mentor")
        .updateOne(
          { mentorName: req.body.mentorName },
          { $set: { assignedStudents: mentor.assignedStudents } }
        );
    }
    res.send({
      message: "student Added to the DB",
    });
  } catch (error) {
    console.log(error);
    res.send({ message: "Error in DB" });
  } finally {
    client.close();
  }
});

router.post("/assign-student", async (req, res) => {
  const client = await MongoClient.connect(dbUrl);
  try {
    const db = client.db("mentorStudent");
    const mentor = await db
      .collection("mentor")
      .findOne({ mentorName: req.body.mentorName });
    req.body.assignedStudents.map(async (students) => {
      mentor.assignedStudents.push(students);
      const student = await db
        .collection("student")
        .updateOne(
          { studentName: students },
          { $set: { mentorName: req.body.mentorName } }
        );
    });
    const update = await db
      .collection("mentor")
      .updateOne(
        { mentorName: req.body.mentorName },
        { $set: { assignedStudents: mentor.assignedStudents } }
      );

    res.json({
      message: "student assgined successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({
      messaage: "Error in DB",
    });
  } finally {
    client.close();
  }
});

router.post("/mentor-changing", async (req, res) => {
  const client = await MongoClient.connect(dbUrl);
  try {
    const db = await client.db("mentorStudent");
    const oldMentorName = await db
      .collection("student")
      .findOne({ studentName: req.body.studentName });

    // updating student collection with new mentor name for that particular student

    const mentorUpdate = await db
      .collection("student")
      .updateOne(
        { studentName: req.body.studentName },
        { $set: { mentorName: req.body.newMentorName } }
      );

    // updating mentor table with student

    const mentor = await db
      .collection("mentor")
      .findOne({ mentorName: req.body.newMentorName });

    mentor.assignedStudents.push(req.body.studentName);

    const studentUpdate = await db
      .collection("mentor")
      .updateOne(
        { mentorName: req.body.newMentorName },
        { $set: { assignedStudents: mentor.assignedStudents } }
      );

    // deleting studentName from the oldmentor details

    const oldMentor = await db
      .collection("mentor")
      .findOne({ mentorName: oldMentorName.mentorName });

    oldMentor.assignedStudents.splice(
      oldMentor.assignedStudents.indexOf(req.body.studentName),
      1
    );

    // updating the mentor collection with remaining students

    const result = await db
      .collection("mentor")
      .updateOne(
        { mentorName: oldMentorName.mentorName },
        { $set: { assignedStudents: oldMentor.assignedStudents } }
      );


      res.json({
        message:"Mentor changed successfully"
      })

  } catch (error) {
    console.log(error);
    res.json({
      message: "Erron in DB",
    });
  } finally {
    client.close();
  }
});

// gettting all the students for a particular mentor
router.get("/all-students", async (req, res) => {
  const client = await MongoClient.connect(dbUrl);
  try {
    const db = await client.db("mentorStudent");
    const mentor = await db
      .collection("mentor")
      .findOne({ mentorName: req.body.mentorName });
    res.json({
      message: mentor,
    });
  } catch (error) {
    console.log(error);
    res.json({
      message: "Error in DB",
    });
  } finally {
    client.close();
  }
});

module.exports = router;
