const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");

const MAX_PER_SLOT = 2;

// ===============================
// ✅ PREVIEW PRICE (ใช้หน้าเลือกบริการ) (หน้า 5 ในไฟล์)
// ===============================
router.post("/preview", authMiddleware, async (req, res) => {
  const vehicles = mongoose.connection.collection("vehicles");
  const services = mongoose.connection.collection("service");

  try {
    const { vehicle_id, main_service, extra_services = [] } = req.body;

    if (!vehicle_id || !main_service) {
      return res.status(400).json({ message: "vehicle_id และ main_service จำเป็น" });
    }

    const vehicle = await vehicles.findOne({
      vehicle_id,
      user_id: req.user.user_id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "ไม่พบรถ" });
    }

    let total = 0;
    const allServices = [main_service, ...extra_services];

    for (let s of allServices) {
      const service = await services.findOne({ service_id: s });

      if (!service) {
        return res.status(404).json({ message: "ไม่พบบริการ" });
      }

      total += service.price;
    }

    const vehicle_extra = vehicle.vehicle_type_id !== 1 ? 100 : 0;

    res.json({
      service_total: total,
      vehicle_extra,
      total_price: total + vehicle_extra
    });

  } catch (err) {
    res.status(500).json({ message: "preview error" });
  }
});


// ===============================
// ✅ CREATE BOOKING (หน้า 5 ในไฟล์)
// ===============================
router.post("/", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");
  const booking_services = mongoose.connection.collection("booking_services");
  const vehicles = mongoose.connection.collection("vehicles");
  const services = mongoose.connection.collection("service");

  try {
    const { vehicle_id, booking_datetime, main_service, extra_services = [] } = req.body;

    if (!vehicle_id || !booking_datetime || !main_service) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    const vehicle = await vehicles.findOne({
      vehicle_id,
      user_id: req.user.user_id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "ไม่พบรถ" });
    }

    // ===============================
    // 🔥 CHECK SLOT
    // ===============================
    const bookingTime = new Date(booking_datetime);
    bookingTime.setSeconds(0, 0);

    const count = await bookings.countDocuments({
      booking_datetime: bookingTime
    });

    if (count >= MAX_PER_SLOT) {
      return res.status(400).json({ message: "ช่วงเวลานี้เต็มแล้ว" });
    }

    // ===============================
    // 🔥 GENERATE booking_id
    // ===============================
    const last = await bookings.find().sort({ booking_id: -1 }).limit(1).toArray();
    const booking_id = last.length ? last[0].booking_id + 1 : 4001;

    let total = 0;
    const allServices = [main_service, ...extra_services];

    for (let s of allServices) {
      const service = await services.findOne({ service_id: s });

      if (!service) {
        return res.status(404).json({ message: "ไม่พบบริการ" });
      }

      total += service.price;

      await booking_services.insertOne({
        booking_service_id: new mongoose.Types.ObjectId(),
        booking_id,
        service_id: s,
        price_at_booking: service.price
      });
    }

    const vehicle_extra = vehicle.vehicle_type_id !== 1 ? 100 : 0;
    const total_price = total + vehicle_extra;

    // ===============================
    // ✅ INSERT BOOKING
    // ===============================
    await bookings.insertOne({
      booking_id,
      user_id: req.user.user_id,
      vehicle_id,
      booking_datetime: bookingTime,
      status: "pending",
      payment_status: "pending",
      total_price,
      created_at: new Date()
    });

    res.json({
      message: "booking created",
      booking_id,
      total_price
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "create booking error" });
  }
});


// ===============================
// ✅ GET MY BOOKINGS (FULL JOIN สำหรับหน้า "ประวัติ")
// ===============================
router.get("/user", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {

    const result = await bookings.aggregate([

      // 🔹 เฉพาะของ user คนนี้
      {
        $match: {
          user_id: req.user.user_id
        }
      },

      // =========================
      // 🔗 JOIN VEHICLE
      // =========================
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "vehicle_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" },

      // =========================
      // 🔗 JOIN BOOKING SERVICES
      // =========================
      {
        $lookup: {
          from: "booking_services",
          localField: "booking_id",
          foreignField: "booking_id",
          as: "booking_services"
        }
      },

      // =========================
      // 🔗 JOIN SERVICE
      // =========================
      {
        $lookup: {
          from: "service",
          localField: "booking_services.service_id",
          foreignField: "service_id",
          as: "service_detail"
        }
      },
      {
       $lookup: {
       from: "users",
       localField: "user_id",
       foreignField: "user_id",
       as: "user"
        }
      },
      { $unwind: "$user" },

      // =========================
      // 🧠 FORMAT OUTPUT
      // =========================
      {
        $project: {
          _id: 0,

          booking_id: 1,
          status: 1,
          payment_status: 1,
          booking_datetime: 1,
          total_price: 1,
          // 👤 USER ✅ (เพิ่มตรงนี้)
          username: "$user.login_name",

          // 🚗 VEHICLE
          vehicle_plate: "$vehicle.license_plate",
          vehicle_brand: "$vehicle.brand",
          vehicle_model: "$vehicle.model",

          // 🧽 SERVICES
          services: {
            $map: {
              input: "$service_detail",
              as: "s",
              in: "$$s.service_name"
            }
          }
        }
      },

      // 🔽 เรียงล่าสุดก่อน
      {
        $sort: { booking_datetime: -1 }
      }

    ]).toArray();

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "fetch bookings error" });
  }
});

// ===============================
// ✅ GET SLOTS (ใช้หน้า UI) (หน้า 5 ในไฟล์)
// =============================== 
router.get("/slots", async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {
    const { date } = req.query;

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const result = await bookings.aggregate([
      {
        $match: {
          booking_datetime: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$booking_datetime",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const slots = result.map(s => ({
      time: s._id,
      current: s.count,
      max: MAX_PER_SLOT
    }));

    res.json(slots);

  } catch (err) {
    res.status(500).json({ message: "slots error" });
  }
});

// ===============================
// ✅ GET BOOKING DETAIL ดูรายละเอียด”
// ===============================
router.get("/:id", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");
  const booking_services = mongoose.connection.collection("booking_services");

  try {
    const bookingId = parseInt(req.params.id);

    const booking = await bookings.findOne({
      booking_id: bookingId,
      user_id: req.user.user_id
    });

    if (!booking) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    const services = await booking_services.find({
      booking_id: bookingId
    }).toArray();

    res.json({
      ...booking,
      services
    });

  } catch (err) {
    res.status(500).json({ message: "fetch booking error" });
  }
});


// ===============================
// ✅ UPDATE STATUS (staff/admin) หน้า “การ์ดงาน + ปุ่มจัดการ”
// ===============================
router.put("/:id", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {

    if (req.user.user_role !== "admin" && req.user.user_role !== "owner") {
      return res.status(403).json({ message: "forbidden" });
    }

    const bookingId = parseInt(req.params.id);
    const { status } = req.body;

    // ✅ VALIDATION
    const allowedStatus = ["pending", "confirmed", "washing", "completed", "cancelled"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "invalid status" });
    }

    const result = await bookings.updateOne(
      { booking_id: bookingId },
      {
        $set: {
          status,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    res.json({ message: "updated", status });

  } catch (err) {
    res.status(500).json({ message: "update error" });
  }
});


// ===============================
// ✅ GET ALL BOOKINGS (FULL JOIN) กระดานคิวงาน (Staff Dashboard)
// ===============================
router.get("/", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {

    // 🔒 เฉพาะ staff / admin
    if (req.user.user_role !== "staff" && req.user.user_role !== "admin") {
      return res.status(403).json({ message: "ไม่มีสิทธิ์" });
    }

    const result = await bookings.aggregate([

      // =========================
      // 🔗 JOIN VEHICLE
      // =========================
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "vehicle_id",
          as: "vehicle"
        }
      },
      { $unwind: "$vehicle" },

      // =========================
      // 🔗 JOIN USER
      // =========================
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "user_id",
          as: "user"
        }
      },
      { $unwind: "$user" },

      // =========================
      // 🔗 JOIN BOOKING SERVICES
      // =========================
      {
        $lookup: {
          from: "booking_services",
          localField: "booking_id",
          foreignField: "booking_id",
          as: "booking_services"
        }
      },

      // =========================
      // 🔗 JOIN SERVICE
      // =========================
      {
        $lookup: {
          from: "service",
          localField: "booking_services.service_id",
          foreignField: "service_id",
          as: "service_detail"
        }
      },

      // =========================
      // 🧠 FORMAT OUTPUT
      // =========================
    {
      $project: {
      _id: 0,

      booking_id: 1,
      status: 1,
      payment_status: 1,
      booking_datetime: 1,
      total_price: 1,

      // 👤 USER
      username: "$user.login_name",

      // 🚗 VEHICLE
      vehicle_plate: "$vehicle.license_plate",
      vehicle_brand: "$vehicle.brand",
      vehicle_model: "$vehicle.model",

      // 🧽 SERVICES
      services: {
        $map: {
          input: "$service_detail",
          as: "s",
          in: "$$s.service_name"
          }
        }
      }
    },

      // =========================
      // 🔽 SORT
      // =========================
      {
        $sort: { booking_datetime: 1 }
      }

    ]).toArray();

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "fetch all bookings error" });
  }
});
// ===============================
// ✅ CANCEL BOOKING (customer)
// ===============================
router.delete("/:id", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {
    const bookingId = parseInt(req.params.id);

    await bookings.updateOne(
      { booking_id: bookingId, user_id: req.user.user_id },
      { $set: { status: "cancelled" } }
    );

    res.json({ message: "cancelled" });

  } catch (err) {
    res.status(500).json({ message: "cancel error" });
  }
});



module.exports = router;