const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");


// ===============================
// ✅ CREATE PAYMENT
// ===============================
router.post("/", authMiddleware, async (req, res) => {

  const payments = mongoose.connection.collection("payments");
  const bookings = mongoose.connection.collection("bookings");

  try {
    const { booking_id, payment_method } = req.body;

    if (!booking_id || !payment_method) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    // 🔍 หา booking
    const booking = await bookings.findOne({
      booking_id,
      user_id: req.user.user_id
    });

    if (!booking) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    // ❌ กันจ่ายซ้ำ
    if (booking.payment_status === "paid") {
      return res.status(400).json({ message: "ชำระเงินแล้ว" });
    }

    // 🔢 generate payment_id
    const last = await payments.find().sort({ payment_id: -1 }).limit(1).toArray();
    const payment_id = last.length ? last[0].payment_id + 1 : 8001;

    // 💰 insert payment
    await payments.insertOne({
      payment_id,
      booking_id,
      total_amount: booking.total_price,
      payment_method, // cash / transfer
      payment_status: "paid",
      paid_at: new Date()
    });

    // 🔄 update booking
    await bookings.updateOne(
      { booking_id },
      {
        $set: {
          payment_status: "paid"
        }
      }
    );

    res.json({
      message: "payment success",
      payment_id
    });

  } catch (err) {
    res.status(500).json({ message: "payment error" });
  }
});


// ===============================
// ✅ GET PAYMENT BY BOOKING
// ===============================
router.get("/:booking_id", authMiddleware, async (req, res) => {

  const payments = mongoose.connection.collection("payments");
  const bookings = mongoose.connection.collection("bookings");

  try {
    const booking_id = parseInt(req.params.booking_id);

    const payment = await payments.findOne({ booking_id });

    if (!payment) {
      return res.status(404).json({ message: "ไม่พบ payment" });
    }

    // 🔥 เช็คเจ้าของ (ถูกที่แล้ว)
    const booking = await bookings.findOne({ booking_id });

    if (!booking || booking.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "forbidden" });
    }

    res.json(payment);

  } catch (err) {
    res.status(500).json({ message: "fetch payment error" });
  }
});

module.exports = router;