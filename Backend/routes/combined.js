const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Transfer = require("../models/Transfer");

router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    const transfers = await Transfer.find();

    const merged = students.map(student => {
      const studentIdStr = student.id;

      const transfer = transfers.find(t => t.student_data?.id === studentIdStr) || null;

      return {
        ...student.toObject(),
        transfer,
      };
    });

    res.json({
      success: true,
      count: merged.length,
      data: merged,
    });
  } catch (err) {
    console.error("Xato:", err);
    res.status(500).json({ success: false, message: "Server xatosi", error: err.message });
  }
});

module.exports = router;
