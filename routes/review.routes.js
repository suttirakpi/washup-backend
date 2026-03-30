const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");

// CREATE REVIEW
router.post("/", authMiddleware, async (req, res) => {
  const reviews = mongoose.connection.collection("reviews");
  const bookings = mongoose.connection.collection("bookings");

  try {
    // ✅ 1. แปลง booking_id เป็น Number เพื่อให้ตรงกับ Int32 ใน MongoDB Compass
    const booking_id = Number(req.body.booking_id);
    const { rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating ต้อง 1-5" });
    }

    // ✅ 2. ค้นหา booking โดยใช้ booking_id ที่เป็น Number
    const booking = await bookings.findOne({
      booking_id: booking_id,
      user_id: req.user.user_id
    });

    if (!booking) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    // ✅ ตรวจสอบสถานะว่าเสร็จงานหรือยัง
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "ยังไม่เสร็จงาน" });
    }

    // ✅ ตรวจสอบสถานะการชำระเงิน
    if (booking.payment_status !== "paid") {
      return res.status(400).json({ message: "ยังไม่ได้ชำระเงิน" });
    }

    const exists = await reviews.findOne({ booking_id });
    if (exists) {
      return res.status(400).json({ message: "รีวิวแล้ว" });
    }

    const last = await reviews.find().sort({ review_id: -1 }).limit(1).toArray();
    const review_id = last.length ? last[0].review_id + 1 : 5001;

    // 3. บันทึกรีวิวลงคอลเลกชัน reviews
    await reviews.insertOne({
      review_id,
      booking_id,
      user_id: req.user.user_id,
      rating,
      comment: comment || "",
      created_at: new Date()
    });

    // ✅ 4. อัปเดตสถานะในคอลเลกชัน bookings (ใช้ booking_id ที่เป็น Number)
    // ตรงนี้จะทำให้ฟิลด์ is_reviewed : true ปรากฏใน MongoDB Compass ของคุณ
    const updateResult = await bookings.updateOne(
      { booking_id: booking_id },
      { $set: { is_reviewed: true } }
    );

    console.log(`Booking ID ${booking_id} updated:`, updateResult.modifiedCount);

    res.json({ message: "review success" });

  } catch (err) {
    console.error("Review Error:", err);
    res.status(500).json({ message: "review error" });
  }
});

// GET review by booking
router.get("/booking/:id", async (req, res) => {
  const reviews = mongoose.connection.collection("reviews");

  try {
    const booking_id = Number(req.params.id);
    const review = await reviews.findOne({ booking_id });

    if (!review) {
      return res.status(404).json({ message: "ยังไม่มีรีวิว" });
    }

    res.json(review);

  } catch (err) {
    res.status(500).json({ message: "fetch review error" });
  }
});

module.exports = router;