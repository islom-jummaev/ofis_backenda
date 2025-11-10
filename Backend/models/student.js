const mongoose = require("mongoose");

const NameSchema = new mongoose.Schema({
  name: { type: String, required: false },
});

const StudentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  image: { type: String },
  level: NameSchema,
  department: NameSchema,
  group: NameSchema,
  year_of_enter: { type: String },
  gender: NameSchema,
  province: NameSchema,
  district: NameSchema,
  educationForm: NameSchema,
  passport_number: { type: String },
  phone: { type: String },
  created_at: { type: String },
});

module.exports = mongoose.model("Student", StudentSchema);
