const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");
require("dotenv").config();

// 1️⃣ .env fayldan olish
const MONGO_URI = process.env.MONGO_URI;

// 2️⃣ Agar .env bo‘lmasa, URL ni bevosita yozish (faqat test uchun)
if (!MONGO_URI) {
  console.warn("❌ MONGO_URI .env faylida mavjud emas! Bevosita URL ishlatiladi.");
}

const DB_URI = MONGO_URI || "mongodb+srv://mengniyozovogabek01:ODhRf5iwwLEhGMhb@launchpro.yo9vbsh.mongodb.net/hemis_test_yangi?retryWrites=true&w=majority&appName=LAUNCHPRO";

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected for seeding"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

const users = [
  {
    name: "Qarshiyev Davronjon Erkin o'g'li",
    email: "davronjon@example.com",
    password: bcrypt.hashSync("123456", 10),
    role: "registratorDB",
    position: "Registrator ofisi Ma'lumotlar bazasi menejeri",
  },
  {
    name: "Jalilov Erkin Ergashevich",
    email: "jalilov@example.com",
    password: bcrypt.hashSync("123456", 10),
    role: "registratorService",
    position: "Registrator ofisi xizmat koʻrsatish boʻlimi boshligʻi",
  },
  {
    name: "Shopo‘latova Barno Ismatullayevna",
    email: "barno@example.com",
    password: bcrypt.hashSync("123456", 10),
    role: "educationManager",
    position: "O‘quv jarayonni muvofiqlashtirish sektori menejeri",
  },
];

User.insertMany(users)
  .then(() => {
    console.log("✅ Foydalanuvchilar qo'shildi");
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ Insert error:", err);
    mongoose.disconnect();
  });
