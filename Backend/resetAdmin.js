// resetAdminPassword.js (Skript nomi o'zgartirilmadi)

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User"); 
require("dotenv").config();

async function resetAdminPassword() {
  try {
    // 1. MongoDB ulanishi
    await mongoose.connect(process.env.MONGO_URL);

    const email = "admin@example.com"; 
    const newPassword = "admin123"; 

    // 2. Parolni hash qilish
    const hashed = await bcrypt.hash(newPassword, 10);

    // 3. Foydalanuvchini topish va yangilash (yoki yaratish)
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashed, role: "admin" }, // Parolni va rolni o'rnatish
      { new: true, upsert: true } // Agar topilmasa, yaratadi
    );

    console.log("✅ Parol yangilandi:", email);
    console.log("🆕 Yangi parol:", newPassword);
  } catch (err) {
    console.error("❌ Admin parolini yangilashda xato yuz berdi:", err);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword();