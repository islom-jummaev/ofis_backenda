  const express = require("express");
  const dotenv = require("dotenv");
  const cors = require("cors");
  const axios = require("axios");
  const fs = require("fs/promises");
  const path = require("path");
  const multer = require("multer");
  const bcrypt = require("bcrypt"); // Import bcrypt for password hashing
  const mongoose = require('mongoose');
  dotenv.config();
  const app = express();
 app.use(cors({
  origin: ["http://localhost:5173", "http://10.1.100.251:5173"], // localhost va lokal IP
  credentials: true
}));
  app.use(cors(corsOptions));
  
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use("/uploads", express.static("uploads"));
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://mengniyozovogabek01:ODhRf5iwwLEhGMhb@launchpro.yo9vbsh.mongodb.net/hemis_test_yangi?retryWrites=true&w=majority&appName=LAUNCHPRO';
  mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error', err);
    process.exit(1);
  });
  axios.defaults.baseURL = process.env.BASE_URL;

  // const users = [
  //   { username: "Islom", password: "admin" },
  //   { username: "admin", password: "admin" },
  // ];

  // app.post("/api/login", (req, res) => {
  //   const { username, password } = req.body;

  //   const user = users.find((u) => u.username === username);
  //   if (!user) {
  //     return res.status(401).json({ message: "User not found" });
  //   }

  //   if (user.password !== password) {
  //     return res.status(401).json({ message: "Invalid password" });
  //   }

  //   res.status(200).json({ message: "Login successful" });
  // });

  // ======= UPLOAD =======
  const storage = multer.diskStorage({
    filename: function (req, file, cb) {
      cb(null, req.params.studentId + path.extname(file.originalname));
    },
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
  });

  const upload = multer({ storage: storage });

  app.post(
    "/api/upload/doc/:studentId",
    upload.single("file"),
    async (req, res) => {
      try {
        if (req.file)
          return res.json({
            message: "Fayl yuklandi!",
            file_owner: req.params.studentId,
          });

        res.status(400).json({ message: "Fayl yuklanmadi!" });
      } catch (error) {
        res.status(500).json({ message: "Serverda xato bo'ldi!" });
      }
    }
  );

  // Fakultetlarni olish uchun so'rov
  app.get("/api/facultets", (req, res) => {
    const lang = req.query.lang;

    axios
      .get(`department-list?_structure_type=11&l=${lang}.`, {
        headers: {
          Authorization: process.env.Authorization,
          accept: "application/json",
        },
      })
      .then((response) => {
        res.status(200).send({
          data: response.data.data.items,
          error: false,
        });
      })
      .catch((err) =>
        res.status(400).send({
          error: true,
          data: err,
        })
      );
  });

  // Guruhlar ro'yxatini olish uchun so'rov
  app.get("/api/groups", (req, res) => {
    const faculty = req.query.faculty;
    const lang = req.query.lang;

    axios
      .get(`group-list?l=${lang}&_department=${faculty}&limit=200`, {
        headers: {
          Authorization: process.env.Authorization,
          accept: "application/json",
        },
      })
      .then((response) => {
        res.status(200).json({
          data: response.data.data.items,
          error: false,
        });
      })
      .catch((err) =>
        res.status(500).json({
          error: true,
          data: err,
        })
      );
  });

  app.get("/api/student", async (req, res) => {
    const { search } = req.query;

    if (!search) {
      return res.status(200).json({ error: false, data: [] });
    }

    try {
      let allStudents = [];
      let page = 1;
      let totalPages = 1;

      do {
        const qs = new URLSearchParams({
          search: search.trim(),
          page: page.toString(),
          limit: "200", // har sahifada maksimal 200 ta yozuv
          _student_status: "-1", // barcha statuslarni olish uchun
        });

        const listResponse = await fetch(
          process.env.BASE_URL + "student-list?" + qs,
          {
            headers: {
              Authorization: process.env.Authorization,
              Accept: "application/json",
            },
          }
        );

        if (!listResponse.ok) {
          return res
            .status(listResponse.status)
            .json({ error: true, data: listResponse.statusText });
        }

        const listJson = await listResponse.json();
        const data = listJson?.data || {};
        const students = data.items || [];

        allStudents.push(...students);

        totalPages = data.pageCount || 1;
        page++;

        // xavfsizlik uchun cheklov
        if (page > totalPages) break;
      } while (page <= totalPages);

      console.log(`✅ ${allStudents.length} ta talaba topildi`);

      // 🔍 Shaxsiy ma’lumotlarni olish
      const personalDataResults = await Promise.all(
        allStudents.map(async (student) => {
          try {
            const resPersonal = await fetch(
              process.env.BASE_URL +
                "student/personal-data?student_id_number=" +
                student.id,
              {
                headers: {
                  Authorization: process.env.Authorization,
                  Accept: "application/json",
                },
              }
            );
            if (resPersonal.ok) {
              const data = await resPersonal.json();
              return data.data;
            }
          } catch {
            return null;
          }
        })
      );

      // 🧩 Ma’lumotlarni birlashtirish
      const combinedData = allStudents.map((student, index) => {
        const personalData = personalDataResults[index];
        return {
          ...student,
          passport_number: personalData?.passport_number || "",
          phone: personalData?.phone || "",
        };
      });

      res.status(200).json({ error: false, data: combinedData });
    } catch (error) {
      console.error("Error fetching student data:", error);
      res.status(500).json({ error: true, data: "Serverda ichki xatolik" });
    }
  });


    

  // Talabalar ro'yxatini olish uchun so'rov
  app.get("/api/studentlist", async (req, res) => {
    const { faculty, group, search, page = 1 } = req.query;

    const qs = new URLSearchParams();
    if (faculty) qs.append("_faculty", faculty);
    if (group) qs.append("_group", group);
    if (search) qs.append("search", search);
    qs.append("page", page);

    try {
      const response = await fetch(process.env.BASE_URL + "student-list?" + qs, {
        headers: {
          Authorization: process.env.Authorization,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const json = await response.json();
        res.status(200).json({
          error: false,
          data: json.data.items,
          pagination: {
            totalCount: json.data.totalCount,
            pageSize: json.data.pageSize,
            pageCount: json.data.pageCount,
            page: json.data.page,
          },
        });
      } else {
        res
          .status(response.status)
          .json({ error: true, data: response.statusText });
      }
    } catch (error) {
      res.status(500).json({ error: true, data: error.message });
    }
  });

  // Bitta student detail
  // Bitta student detail (id o'rniga student_id_number bilan)
  app.get("/api/studentlist/:student_id_number", async (req, res) => {
    const { student_id_number } = req.params;

    try {
      // 1. To‘g‘ridan-to‘g‘ri qidirib ko‘ramiz
      const directResp = await fetch(
        `${process.env.BASE_URL}student/${student_id_number}`,
        {
          headers: {
            Authorization: process.env.Authorization,
            Accept: "application/json",
          },
        }
      );

      if (directResp.ok) {
        const json = await directResp.json();
        if (json?.data) {
          return res.status(200).json({ error: false, data: json.data });
        }
      }

      // 2. Agar ishlamasa, student-list orqali qidiramiz
      const searchResp = await fetch(
        `${process.env.BASE_URL}student-list?search=${student_id_number}`,
        {
          headers: {
            Authorization: process.env.Authorization,
            Accept: "application/json",
          },
        }
      );

      if (searchResp.ok) {
        const sjson = await searchResp.json();
        const items = sjson?.data?.items || [];

        // faqat student_id_number bo‘yicha qidiramiz
        const found = items.find(
          (x) => String(x.student_id_number) === String(student_id_number)
        );

        if (found) {
          return res.status(200).json({ error: false, data: found });
        }
      }

      return res.status(404).json({ error: true, data: "Talaba topilmadi" });
    } catch (e) {
      return res.status(500).json({ error: true, data: e.message });
    }
  });



  // O‘quv rejalari ro‘yxatini olish uchun so‘rov
  // O‘quv rejalari ro‘yxatini olish uchun so‘rov
  app.get("/api/curriculums", async (req, res) => {
    try {
      let allCurriculums = [];
      let page = 1;
      // req.query dan filtrlarni qabul qilish
      const { page: queryPage, limit: queryLimit, specialty_id, education_form, education_year } = req.query;

      const limit = parseInt(queryLimit) || 200;
      
      console.log("🌀 O‘quv rejalari yuklanmoqda...");

      // Barcha ma'lumotlarni yuklash o'rniga, faqat birinchi sahifani yuklash kerak bo'lishi mumkin. 
      // Agar filtrlash samarali bo'lsa, yoxud filtrlarsiz barcha ma'lumotlarni yuklashni optimallashtirish kerak.
      
      // Asosiy URL ga filtrlarni qo'shish
      let baseUrl = `${process.env.BASE_URL}curriculum-list?limit=${limit}`;

      if (specialty_id) {
          baseUrl += `&specialty_id=${specialty_id}`;
      }
      if (education_form) {
          baseUrl += `&education_form=${education_form}`;
      }
      if (education_year) {
          baseUrl += `&education_year=${education_year}`; // <<< YANGI FILTR
      }

      // Agar sizning tashqi API'ingiz sahifalashni qo'llab-quvvatlasa va biz barchasini olishimiz kerak bo'lsa:
      while (true) {
        const response = await fetch(
          `${baseUrl}&page=${page}`,
          {
            headers: {
              Authorization: process.env.Authorization,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(`❌ ${page}-sahifani olishda xato`);
          break;
        }

        const data = await response.json();
        const items = data?.data?.items || [];

        if (items.length === 0 || items.length < limit) { // Oxirgi sahifa sharti
          allCurriculums.push(...items);
          console.log("✅ Barcha sahifalar yuklandi yoki birinchi sahifa to'liq emas.");
          break;
        }

        allCurriculums.push(...items);

        console.log(`✅ Sahifa ${page}: ${items.length} ta o‘quv reja olindi.`);
        page++;
      }

      console.log(`🎉 Jami ${allCurriculums.length} ta o‘quv reja olindi.`);

      res.json({
        totalCount: allCurriculums.length,
        data: allCurriculums,
      });
    } catch (error) {
      console.error("❌ Xatolik:", error);
      res.status(500).json({ message: "Server xatosi", error: error.message });
    }
  });





  // O‘quv reja fanlari ro‘yxatini olish uchun so‘rov
  app.get("/api/curriculum-subjects", async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      _curriculum, 
      _subject_type, 
      _exam_finish, 
      _rating_grade, 
      _semester, 
      _department 
    } = req.query;

    if (!_curriculum) {
      return res.status(400).json({ error: true, data: "⚠️ _curriculum parametri talab qilinadi!" });
    }

    const qs = new URLSearchParams();
    qs.append("page", page);
    qs.append("limit", limit);
    qs.append("_curriculum", _curriculum); // ✅ asosiy filter
    if (_subject_type) qs.append("_subject_type", _subject_type);
    if (_exam_finish) qs.append("_exam_finish", _exam_finish);
    if (_rating_grade) qs.append("_rating_grade", _rating_grade);
    if (_semester) qs.append("_semester", _semester);
    if (_department) qs.append("_department", _department);

    try {
      const response = await fetch(
        process.env.BASE_URL + "curriculum-subject-list?" + qs.toString(),
        {
          headers: {
            Authorization: process.env.Authorization,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: true, data: await response.text() });
      }

      const json = await response.json();

      res.status(200).json({
        error: false,
        data: json.data.items || [], // ✅ fanlar
        pagination: {
          totalCount: json.data.totalCount,
          pageSize: json.data.pageSize,
          pageCount: json.data.pageCount,
          page: json.data.page,
        },
      });
    } catch (err) {
      console.error("Error fetching curriculum subjects:", err.message);
      res.status(500).json({ error: true, data: err.message });
    }
  });


  // Fakultet bo‘yicha faqat "Sirtqi" ta’lim shaklidagi o‘quv rejalari
  app.get("/api/faculty-curriculums", async (req, res) => {
    const { faculty_id, page = 1, limit = 1000 } = req.query;

    if (!faculty_id) {
      return res.status(400).json({ error: true, data: "⚠️ faculty_id parametri kerak!" });
    }

    try {
      const qs = new URLSearchParams({ page, limit });
      qs.append("_department", faculty_id); // fakultet filter

      const response = await fetch(
        `${process.env.BASE_URL}curriculum-list?${qs.toString()}`,
        {
          headers: {
            Authorization: process.env.Authorization,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({
          error: true,
          data: await response.text(),
        });
      }

      const json = await response.json();

      // faqat "Sirtqi" (yoki "sirtqi") ta’lim shaklidagi o‘quv rejalar
      const filtered = (json.data.items || []).filter(
        (item) =>
          item.educationForm &&
          item.educationForm.name &&
          item.educationForm.name.toLowerCase().includes("sirtqi")
      );

      res.status(200).json({
        error: false,
        total: filtered.length,
        data: filtered.map((item) => ({
          id: item.id,
          name: item.name,
          department: item.department?.name || "",
          specialty: item.specialty?.name || "",
          education_form: item.educationForm?.name || "",
          education_type: item.educationType?.name || "",
          education_year: item.educationYear?.code || "",
        })),
      });
    } catch (err) {
      console.error("Error fetching faculty curriculums:", err.message);
      res.status(500).json({ error: true, data: err.message });
    }
  });

    


  // Jadval olish uchun so'rov
  app.get("/api/schedule", (req, res) => {
    const faculty = req.query.faculty;
    const group = req.query.group;
    const lang = req.query.lang;
    const semester = req.query.semester;

    axios
      .get(
        `schedule-list?l=${lang}&_faculty=${faculty}&_group=${group}&_semester=${semester}&limit=200`,
        {
          headers: {
            Authorization: process.env.Authorization,
            accept: "application/json",
          },
        }
      )
      .then((response) => {
        if (response.data.data.items.length !== 0) {
          let week =
            response.data.data.items[response.data.data.items.length - 1][
              "_week"
            ];
          res.status(200).send({
            data: response.data.data.items.filter(
              (item) => item["_week"] === week
            ),
            error: false,
          });
        } else {
          res.status(200).send({
            data: [],
            error: false,
          });
        }
      })
      .catch((err) => {
        res.status(400).send({
          error: true,
          data: err,
        });
      });
  });
  app.use(cors({
    origin: "http://localhost:5173", // Frontend manzili
    credentials: true, // Cookie/Authorization headerlariga ruxsat berish
  }));
  const transferRouter = require('./routes/transfer');
  app.use('/api/student-transfer', transferRouter);
  const studentRoutes = require('./routes/student');
  app.use("/api/student", studentRoutes);
  const combinedRoutes = require("./routes/combined");
  app.use("/api/combined", combinedRoutes);
  const authRoutes = require("./routes/auth.routes");
  app.use("/api/auth", authRoutes);
  // ✅ yangi router
  // ✅ yangi qo‘shildi

  app.use(async (req, res) => {
    res.status(404).json({ message: "Topilmadi." });
  });

  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log(`app is running ${process.env.PORT}`));
