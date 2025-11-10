const mongoose = require('mongoose');

// 🔹 Har bir fanga oid ma’lumot
const AllSubjectSchema = new mongoose.Schema({
  id: String,
  subject_name: String,
  curriculum_credit: Number,
  semester: String,
  matched_name: String,
  matched_credit: Number,
  matched_grade: String,
kb: Number,
  credit_difference: Number
}, { _id: false });

// 🔹 Mos tushgan fanlar
const MatchedSubjectSchema = new mongoose.Schema({
  subjectId: String,
  name: String,
  credit: Number,
  grade: Number,

}, { _id: false });

// 🔹 Talaba ma’lumotlari
const StudentDataSchema = new mongoose.Schema({
  id: String,
  full_name: String,
  phone: String,
  passport_number: String,
  created_at: String,
  from_university_name: String,
  from_specialty_name: String
}, { _id: false });

// 🔹 Maqsad o‘quv reja
const TargetCurriculumSchema = new mongoose.Schema({
  id: String,
  name: String,
  department_name: String,
  specialty_name: String
}, { _id: false });

// 🔹 Umumiy hisobot
const SummarySchema = new mongoose.Schema({
  total_original_credit: Number,
  total_matched_credit: Number,
  total_credit_difference: Number,
  gpa: String,
  grade_sum: Number,
  kb: Number
}, { _id: false });

// 🔹 Imzo uchun schema
const SignatureSchema = new mongoose.Schema({
  title: String,      // lavozim
  name: String        // ism familiya
}, { _id: false });


// 🔹 Asosiy Transfer hujjati
const TransferSchema = new mongoose.Schema({
  student_data: StudentDataSchema,
  target_curriculum: TargetCurriculumSchema,
matched_subjects: [AllSubjectSchema], // Buni Map qoldirdim, routeringizda shunday ekan
  all_subjects: [AllSubjectSchema],
  summary: SummarySchema,
manual_note: { type: String, default: "" },
  // ✅ YECHIM: Imzolar massivini saqlash
  signatures: [SignatureSchema],
  
  createdAt: { type: Date, default: Date.now },
  createdBy: String
});

module.exports = mongoose.model('Transfer', TransferSchema);