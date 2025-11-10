const express = require("express");
const router = express.Router();
const Student = require("../models/Student");

// 🔍 Qidiruv (ID yoki ism bo‘yicha)
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const query = search
      ? {
          $or: [
            { id: { $regex: search, $options: "i" } },
            { full_name: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const students = await Student.find(query).limit(20);
    res.json({ error: false, data: students });
  } catch (error) {
    console.error("Qidiruv xatosi:", error);
    res.status(500).json({ error: true, message: "Server xatosi" });
  }
});

// ➕ Yangi talaba qo‘shish
router.post("/", async (req, res) => {
  try {
    const studentData = req.body;

    // mavjud bo‘lsa, yangilaymiz
    let student = await Student.findOne({ id: studentData.id });

    if (student) {
      student = await Student.findOneAndUpdate({ id: studentData.id }, studentData, {
        new: true,
      });
      return res.status(200).json({
        error: false,
        message: "Talaba ma'lumotlari yangilandi",
        data: student,
      });
    }

    // aks holda yangisini yaratamiz
    const newStudent = new Student(studentData);
    await newStudent.save();

    res.status(201).json({
      error: false,
      message: "Yangi talaba qo‘shildi",
      data: newStudent,
    });
  } catch (error) {
    console.error("Talaba qo‘shishda xato:", error);
    res.status(500).json({ error: true, message: "Server xatosi" });
  }
});

// 🧍‍♂️ Bitta talabani ID orqali olish
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });
    if (!student)
      return res.status(404).json({ error: true, message: "Talaba topilmadi" });

    res.json({ error: false, data: student });
  } catch (error) {
    console.error("Talaba topishda xato:", error);
    res.status(500).json({ error: true, message: "Server xatosi" });
  }
});

module.exports = router;
