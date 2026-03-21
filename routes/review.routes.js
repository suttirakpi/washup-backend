const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");

// CREATE REVIEW
router.post("/", authMiddleware, async (req, res) => {

  const reviews = mongoose.connection.collection("reviews");
  const bookings = mongoose.connection.collection("bookings");

  try {
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating ต้อง 1-5" });
    }

    const booking = await bookings.findOne({
      booking_id,
      user_id: req.user.user_id
    });

    if (!booking) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    if (booking.payment_status !== "paid") {
      return res.status(400).json({ message: "ยังรีวิวไม่ได้" });
    }

    const exists = await reviews.findOne({ booking_id });
    if (exists) {
      return res.status(400).json({ message: "รีวิวแล้ว" });
    }

    const last = await reviews.find().sort({ review_id: -1 }).limit(1).toArray();
    const review_id = last.length ? last[0].review_id + 1 : 5001;

    await reviews.insertOne({
      review_id,
      booking_id,
      user_id: req.user.user_id,
      rating,
      comment: comment || "",
      created_at: new Date()
    });

    res.json({ message: "review success" });

  } catch (err) {
    res.status(500).json({ message: "review error" });
  }
});

// GET review by booking
router.get("/booking/:id", async (req, res) => {
  const reviews = mongoose.connection.collection("reviews");

  try {
    const booking_id = parseInt(req.params.id);

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