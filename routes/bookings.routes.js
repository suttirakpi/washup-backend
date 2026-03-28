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
    if (!Array.isArray(extra_services)) {
    return res.status(400).json({ message: "extra_services ต้องเป็น array" });
    }
    const vehicle = await vehicles.findOne({
      vehicle_id,
      user_id: req.user.user_id
    });

    if (!vehicle) {
      return res.status(404).json({ message: "ไม่พบรถ" });
    }

    let total = 0;
    let mainServicePrice = 0;
    let extraServicesPrice = 0;

    const serviceList = [];
    const allServices = [main_service, ...extra_services];

    for (let s of allServices) {
      const service = await services.findOne({ service_id: s });

      if (!service) {
        return res.status(404).json({ message: "ไม่พบบริการ" });
      }

      total += service.price;

      // 🔥 แยก main / extra
      if (s === main_service) {
        mainServicePrice = service.price;
      } else {
        extraServicesPrice += service.price;
      }

      serviceList.push({
        service_id: s,
        name: service.service_name,
        price: service.price
      });
    }
    const vehicle_extra = vehicle.vehicle_type_id !== 1 ? 100 : 0;

    res.json({
      services: serviceList,
      main_service_price: mainServicePrice,   // 🔥 เพิ่ม
      extra_services_price: extraServicesPrice,
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
    // 🔥 ใส่ตรงนี้เลย
    if (!Array.isArray(extra_services)) {
      return res.status(400).json({ message: "extra_services ต้องเป็น array" });
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
      created_at: new Date(),

      checkin_note: null, // 🔥 เพิ่มบรรทัดนี้
      staff_note: ""             // 🔥 เพิ่มบรรทัดนี้

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
          checkin_note: 1,
          staff_note: 1,
          started_at: 1,
          finished_at: 1,
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
     // 🔥 map status ให้ตรง UI
    const mapStatus = (status) => {
      switch (status) {
        case "pending": return "Pending";
        case "confirmed": return "Confirmed";
        case "washing": return "In Progress";
        case "completed": return "Ready";
        default: return status;
      }
    };

    // 🔥 เพิ่ม ui_status
    const formatted = result.map(b => ({
      ...b,
      ui_status: mapStatus(b.status)
    }));

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "fetch bookings error" });
  }
});





// ===============================
// ✅ UPDATE STATUS (staff/admin) หน้า “การ์ดงาน + ปุ่มจัดการ”
// ===============================
router.put("/:id", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {

    if (req.user.user_role !== "admin" && req.user.user_role !== "staff") {
      return res.status(403).json({ message: "forbidden" });
    }

    const bookingId = parseInt(req.params.id);
    const { status, checkin_note, staff_note } = req.body;

    // ✅ VALIDATION
    const allowedStatus = ["pending", "confirmed", "washing", "completed", "cancelled"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "invalid status" });
    }

      const update = {
        status,
        updated_at: new Date(),

        ...(checkin_note !== undefined && { checkin_note }),
        ...(staff_note !== undefined && { staff_note })
      };

      // 🔥 เพิ่ม 2 อันนี้
      if (status === "washing") {
        update.started_at = new Date();
      }

      if (status === "completed") {
        update.finished_at = new Date();
      }

      const result = await bookings.updateOne(
        { booking_id: bookingId },
        { $set: update }
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
    const { date } = req.query;

    let matchStage = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);

      const end = new Date(date);
      end.setHours(23,59,59,999);

      matchStage.booking_datetime = { $gte: start, $lte: end };
    }

    const result = await bookings.aggregate([
      {
      $match: matchStage // ✅ ใส่ตรงนี้ "ตัวแรกสุด"
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
      checkin_note: 1,
      staff_note: 1,

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
router.put("/:id/cancel", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {
    const bookingId = parseInt(req.params.id);

    const booking = await bookings.findOne({ booking_id: bookingId });

    if (!booking) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    if (booking.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "forbidden" });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "ยกเลิกไม่ได้" });
    }

    await bookings.updateOne(
      { booking_id: bookingId },
      {
        $set: {
          status: "cancelled",
          updated_at: new Date()
        }
      }
    );

    res.json({ message: "cancel success" });

  } catch (err) {
    res.status(500).json({ message: "cancel error" });
  }
});
// ===============================
// ✅ GET AVAILABLE SLOTS (หน้าเลือกเวลา)
// ===============================
router.get("/slots", authMiddleware, async (req, res) => {
  const bookings = mongoose.connection.collection("bookings");

  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date required" });
    }

    // เวลาตาม UI
    const TIMES = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];

    // ✅ ใช้เวลาไทย
    const start = new Date(`${date}T00:00:00+07:00`);
    const end = new Date(`${date}T23:59:59+07:00`);

    const dayBookings = await bookings.find({
      booking_datetime: { $gte: start, $lte: end }
    }).toArray();

    // ✅ นับจำนวนแต่ละ slot (แบบเร็ว + ไม่เพี้ยน)
    const slotCount = {};

    dayBookings.forEach(b => {
      const d = new Date(b.booking_datetime);

      const thaiTime = d.toLocaleString("en-GB", {
        timeZone: "Asia/Bangkok",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      if (!slotCount[thaiTime]) {
        slotCount[thaiTime] = 0;
      }

      slotCount[thaiTime] += 1;
    });

    // ✅ สร้าง result สำหรับ frontend
    const result = TIMES.map(time => ({
      time,
      count: slotCount[time] || 0,
      max: MAX_PER_SLOT
    }));

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "slot error" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");
  const vehicles = mongoose.connection.collection("vehicles");
  const users = mongoose.connection.collection("users");
  const bookingServices = mongoose.connection.collection("booking_services");
  const services = mongoose.connection.collection("service");

  try {
    const bookingId = parseInt(req.params.id);

    const booking = await bookings.findOne({ booking_id: bookingId });

    if (!booking) {
      return res.status(404).json({ message: "ไม่พบ booking" });
    }

    const vehicle = await vehicles.findOne({ vehicle_id: booking.vehicle_id });
    const user = await users.findOne({ user_id: booking.user_id });

    const serviceData = await bookingServices.aggregate([
      { $match: { booking_id: bookingId } },
      {
        $lookup: {
          from: "service",
          localField: "service_id",
          foreignField: "service_id",
          as: "service"
        }
      },
      { $unwind: "$service" }
    ]).toArray();

    res.json({
      booking_id: booking.booking_id,
      status: booking.status,
      payment_status: booking.payment_status,
      booking_datetime: booking.booking_datetime,
      total_price: booking.total_price,

      checkin_note: booking.checkin_note,
      staff_note: booking.staff_note,

      started_at: booking.started_at,
      finished_at: booking.finished_at,

      customer: user?.login_name,
      vehicle: {
        plate: vehicle?.license_plate,
        brand: vehicle?.brand,
        model: vehicle?.model
      },

      services: serviceData.map(s => s.service.service_name)
    });

  } catch (err) {
    res.status(500).json({ message: "fetch booking error" });
  }
});
router.put("/:id/finish", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");

  try {
    if (req.user.user_role !== "admin" && req.user.user_role !== "staff") {
      return res.status(403).json({ message: "forbidden" });
    }

    const bookingId = parseInt(req.params.id);

    await bookings.updateOne(
      { booking_id: bookingId },
      {
        $set: {
          status: "completed",
          finished_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    res.json({ message: "job finished" });

  } catch (err) {
    res.status(500).json({ message: "finish error" });
  }
});
module.exports = router;