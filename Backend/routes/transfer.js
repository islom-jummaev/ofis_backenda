const express = require('express');
const { body, validationResult } = require('express-validator');
const Transfer = require('../models/Transfer');

const router = express.Router();

// POST — Transfer ma'lumotlarini saqlash
router.post(
  '/',
  [
    body('student_data').exists(),
    body('target_curriculum').exists(),
    body('all_subjects').isArray().optional({ nullable: true }),
    body('summary').optional(),

    body('signatures').isArray().optional() 
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const payload = req.body;
      const transfer = new Transfer({
        student_data: payload.student_data,
        target_curriculum: payload.target_curriculum,
        all_subjects: payload.all_subjects || [],
        matched_subjects: payload.matched_subjects || {}, // Agar kerak bo'lsa
        summary: payload.summary || {},
        manual_note: payload.manual_note || "", 
        signatures: payload.signatures || [], 
        createdBy: payload.createdBy || ''
        
      });

      const saved = await transfer.save();
      res.status(201).json({ error: false, data: saved });
    } catch (err) {
      console.error('❌ Error saving transfer:', err);
      res.status(500).json({ error: true, data: 'Serverda xatolik yuz berdi' });
    }
  }
);

// GET — Barcha transferlar
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Transfer.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transfer.countDocuments()
    ]);

    res.json({
      error: false,
      data: items,
      pagination: { total, page, limit, pageCount: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('❌ Error fetching transfers:', err);
    res.status(500).json({ error: true, data: 'Server error' });
  }
});

// GET — Bitta transferni olish
router.get('/:id', async (req, res) => {
  try {
    const doc = await Transfer.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: true, data: 'Topilmadi' });
    res.json({ error: false, data: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, data: 'Server error' });
  }
});

module.exports = router;
