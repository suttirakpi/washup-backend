const express = require("express"); // ใช้สร้าง API Server
const mongoose = require("mongoose"); // ใช้เชื่อมต่อ MongoDB
const path = require("path");
const cors = require("cors");

const app = express(); // สร้างตัวแอป server

app.use(express.json());
app.use(cors());// อนุญาต CORS


// เชื่อมต่อ Database
mongoose.connect("mongodb://127.0.0.1:27017/carwashDB");

const authMiddleware = require("./middlewares/auth");
const userRoutes = require("./routes/user.routes");
const vehicleRoutes = require("./routes/vehicles.routes");
const serviceRoutes = require("./routes/service.routes");
const bookingsRoutes = require("./routes/bookings.routes");
const paymentRoutes = require("./routes/payment.routes");
const reviewRoutes = require("./routes/review.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const vehicleTypeRoutes = require("./routes/vehicleType.routes");



app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vehicle-types", vehicleTypeRoutes);



//app.use(express.static(path.join(__dirname, "dist")));// อนุญาตให้ Frontend ยิง API เข้ามาได้
// หน้า staff
//app.get("/staff", (req, res) => {
  //res.sendFile(path.join(__dirname, "dist", "staff", "index.html"));
//});

<<<<<<< HEAD
    // หา user ล่าสุด
    const lastUser = await db.find().sort({ user_id: -1 }).limit(1).toArray();

    let newUserId = 1001; // ค่าเริ่มต้น

    if (lastUser.length > 0) {
      newUserId = lastUser[0].user_id + 1;
    }

    const hashedPassword = await bcrypt.hash(req.body.login_password, 10); // เข้ารหัสรหัสผ่าน

    const user = {
      user_id: newUserId,
      login_name: req.body.login_name,
      login_password: hashedPassword,
      user_role: "customer",
      fullname: req.body.fullname,
      phone: req.body.phone,
    };
    //บันทึกข้อมูลลง MongoDB
    const result = await db.insertOne(user);

    // ส่งข้อมูลกลับเป็น JSON
    res.json({
      message: "register sucess",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

app.post("/users/login", async (req, res) => {
  //ใช้สำหรับเข้าสู่ระบบผู้ใช้ โดยรับข้อมูลจาก client ผ่าน HTTP POST และตรวจสอบกับข้อมูลใน MongoDB

  const db = mongoose.connection.collection("users");

  try {
    // เช็คว่ากรอกข้อมูลครบไหม
    if (!req.body.login_name || !req.body.login_password) {
      return res
        .status(400)
        .json({ message: "please fill login_name and password" });
    }

    // หา user ใน database
    const user = await db.findOne({ login_name: req.body.login_name });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    // ตรวจ password
    const isMatch = await bcrypt.compare(
      req.body.login_password,
      user.login_password,
    );

    if (!isMatch) {
      return res.status(400).json({ message: "wrong password" });
    }

    // สร้าง token
    const token = jwt.sign({ user_id: user.user_id }, SECRET, {
      expiresIn: "1h",
    });

    // login สำเร็จ
    res.json({
      message: "login success",
      token: token,
      user: {
        user_id: user.user_id,
        login_name: user.login_name,
        user_role: user.user_role,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]; // รับ token จาก header

  if (!token) {
    return res.status(401).json({ message: "no token" });
  }

  try {
    const decoded = jwt.verify(token, SECRET); // ตรวจ token
    req.user = decoded; // เก็บ user_id ไว้ใน req
    next(); // ไปทำ API ต่อ
  } catch (error) {
    res.status(401).json({ message: "invalid token" });
  }
}

// API สำหรับดึงข้อมูลผู้ใช้ตาม user_id ทำส่วนหน้าโปรไฟล์ของผู้ใช้
app.get("/users/:id", authMiddleware, async (req, res) => {
  // เชื่อม collection users ใน MongoDB
  const db = mongoose.connection.collection("users");

  try {
    // รับค่า id จาก URL เช่น /users/1001
    const userId = parseInt(req.params.id);

    // ค้นหาผู้ใช้ใน database
    const user = await db.findOne({ user_id: userId });

    // ถ้าไม่พบผู้ใช้
    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    // ส่งข้อมูลกลับไปให้ frontend
    res.json({
      user_id: user.user_id,
      login_name: user.login_name,
      user_role: user.user_role,
      fullname: user.fullname,
      phone: user.phone,
    });
  } catch (error) {
    // ถ้า server error
    res.status(500).json({
      message: "server error",
    });
  }
});

// API สำหรับแก้ไขข้อมูลผู้ใช้ ทำส่วนหน้าโปรไฟล์ของผู้ใช้
app.put("/users/:id", authMiddleware, async (req, res) => {
  // เชื่อม collection users
  const db = mongoose.connection.collection("users");
  try {
    // รับ user_id จาก URL
    const userId = parseInt(req.params.id);

    // ค้นหาผู้ใช้ใน database
    const { fullname, phone } = req.body;

    // ตรวจว่ามีข้อมูลส่งมาหรือไม่
    if (!fullname || !phone) {
      return res
        .status(400)
        .json({ message: "please fill fullname and phone" });
    }

    // อัปเดตข้อมูลใน database
    const result = await db.updateOne(
      { user_id: userId },
      { $set: { fullname: fullname, phone: phone } },
    );

    // ถ้าไม่พบ user
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "user not found",
      });
    }

    // ส่งข้อมูลกลับไปให้ frontend
    res.json({
      message: "user updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

//API สำหรับ Vehicles (รถของลูกค้า)//

// API สำหรับเพิ่มข้อมูลรถ หน้า Add Vehicle (เพิ่มรถ)
app.post("/vehicles", authMiddleware, async (req, res) => {
  // เชื่อม collection vehicles
  const db = mongoose.connection.collection("vehicles");
  try {
    // รับข้อมูลจาก body
    const { vehicle_type_id, license_plate, brand, model, color, note } =
      req.body;

    // ตรวจว่ามีข้อมูลส่งมาหรือไม่
    if (!vehicle_type_id || !license_plate || !brand || !model || !color) {
      return res
        .status(400)
        .json({ message: "please fill all fields except note" });
    }

    // หา vehicle_id ล่าสุด
    const lastVehicle = await db
      .find()
      .sort({ vehicle_id: -1 })
      .limit(1)
      .toArray();

    let newVehicleId = 2001; // ค่าเริ่มต้น

    if (lastVehicle.length > 0) {
      newVehicleId = lastVehicle[0].vehicle_id + 1;
    }

    // สร้าง object รถ
    const vehicle = {
      vehicle_id: newVehicleId,
      user_id: req.user.user_id, // ใช้ user_id จาก token ที่ผ่าน authMiddleware มาแล้ว
      vehicle_type_id: parseInt(vehicle_type_id),
      license_plate,
      brand,
      model,
      color,
      note,
    };

    //บันทึกข้อมูลลง MongoDB
    const result = await db.insertOne(vehicle);

    // ส่งข้อมูลกลับเป็น JSON
    res.json({
      message: "vehicle added successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
});

// API สำหรับดึงรถทั้งหมดของ user (ใช้ token)
app.get("/vehicles/user", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("vehicles");

  try {
    // ดึง user_id จาก token
    const userId = req.user.user_id;

    // ค้นหารถทั้งหมดของ user
    const vehicles = await db.find({ user_id: userId }).toArray();

    // ถ้าไม่มีรถ
    if (vehicles.length === 0) {
      return res.json({
        message: "no vehicles found",
      });
    }

    // ส่งข้อมูลกลับไป
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({
      message: "server error",
    });
  }
});

// API สำหรับแก้ไขข้อมูลรถ
app.put("/vehicles/:id", authMiddleware, async (req, res) => {

  const db = mongoose.connection.collection("vehicles");

  try {

    // รับ vehicle_id จาก URL
    const vehicleId = parseInt(req.params.id);

    // รับข้อมูลใหม่จาก body
    const { vehicle_type_id, license_plate, brand, model, color, note } = req.body;

    // ตรวจว่ามีข้อมูลส่งมาหรือไม่
    if (!vehicle_type_id || !license_plate || !brand || !model || !color) {
      return res.status(400).json({ 
        message: "please fill all fields except note" 
      });
    }

    // อัปเดตข้อมูลรถ (แก้ได้เฉพาะรถของ user ที่ login)
    const result = await db.updateOne(
      { 
        vehicle_id: vehicleId,
        user_id: req.user.user_id
      },
      {
        $set: {
          vehicle_type_id: parseInt(vehicle_type_id),
          license_plate: license_plate,
          brand: brand,
          model: model,
          color: color,
          note: note
        }
      }
    );

    // ถ้าไม่พบรถ หรือไม่ใช่เจ้าของรถ
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "vehicle not found or not your vehicle"
      });
    }

    // ส่งผลกลับไป
    res.json({
      message: "vehicle updated successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "server error"
    });
  }
});
=======
// React router fallback
//app.use((req, res) => {
//  res.sendFile(path.join(__dirname, "dist", "index.html"));//
//});
>>>>>>> back

// API สำหรับลบรถ
app.delete("/vehicles/:id", authMiddleware, async (req, res) => {

  const db = mongoose.connection.collection("vehicles");

  try {

    // รับ vehicle_id จาก URL
    const vehicleId = parseInt(req.params.id);

    // ลบเฉพาะรถของ user ที่ login
    const result = await db.deleteOne({
      vehicle_id: vehicleId,
      user_id: req.user.user_id
    });

    // ถ้าไม่พบรถ
    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "vehicle not found or not your vehicle"
      });
    }

    // ส่งผลลัพธ์กลับ
    res.json({
      message: "vehicle deleted successfully"
    });

  } catch (error) {

    res.status(500).json({
      message: "server error"
    });

  }

});

    //services // API สำหรับดึงข้อมูลประเภทบริการล้างรถทั้งหมด
app.get("/service", async (req, res) => {
  const db = mongoose.connection.collection("service");
  try{
    const services = await db.find({ is_active: true }).toArray();
    res.json(services);
  } catch (error) {
    res.status(500).json({
      message: "server error"
    });
  }
});

 //service-prices // API สำหรับดึงข้อมูลราคาบริการล้างรถทั้งหมด
 app.get("/service-prices", async (req, res) => {
  const db = mongoose.connection.collection("service_prices");
  try{
    const prices  = await db.find({ }).toArray();
    res.json(prices);
  }catch (error) {
  res.status(500).json({
    message: "server error"
  });
 }
});
    //API bookings //

// POST /bookings
// ใช้สร้างการจองใหม่

// POST /bookings
// สร้าง booking และ booking_services โดยให้ id เพิ่มเอง

app.post("/bookings", authMiddleware, async (req, res) => {

  const bookings = mongoose.connection.collection("bookings");
  const booking_services = mongoose.connection.collection("booking_services");
  const vehicles = mongoose.connection.collection("vehicles");
  const service_prices = mongoose.connection.collection("service_prices");

  try {

    const { vehicle_id, booking_datetime, services } = req.body;

    // -----------------------------
    // สร้าง booking_id อัตโนมัติ
    // -----------------------------
    const lastBooking = await bookings
      .find({})
      .sort({ booking_id: -1 })
      .limit(1)
      .toArray();

    const booking_id = lastBooking.length > 0 ? lastBooking[0].booking_id + 1 : 4001;

    // -----------------------------
    // หา vehicle_type
    // -----------------------------
    const vehicle = await vehicles.findOne({ vehicle_id: vehicle_id });

    if (!vehicle) {
      return res.status(404).json({ message: "vehicle not found" });
    }

    const vehicleTypeId = vehicle.vehicle_type_id;

    // -----------------------------
    // insert booking
    // -----------------------------
    await bookings.insertOne({
      booking_id: booking_id,
      user_id: req.user.user_id,
      vehicle_id: vehicle_id,
      booking_datetime: new Date(booking_datetime),
      status: "pending"
    });

    // -----------------------------
    // loop services
    // -----------------------------
    for (let service_id of services) {

      // หา price จาก service_prices
      const priceData = await service_prices.findOne({
        service_id: service_id,
        vehicle_type_id: vehicleTypeId
      });

      if (!priceData) {
        return res.status(404).json({ message: "price not found" });
      }

      // -----------------------------
      // สร้าง booking_service_id อัตโนมัติ
      // -----------------------------
      const lastService = await booking_services
        .find({})
        .sort({ booking_service_id: -1 })
        .limit(1)
        .toArray();

      const booking_service_id =
        lastService.length > 0
          ? lastService[0].booking_service_id + 1
          : 7001;

      // insert booking_services
      await booking_services.insertOne({
        booking_service_id: booking_service_id,
        booking_id: booking_id,
        service_id: service_id,
        price_at_booking: priceData.price
      });

    }

    res.json({
      message: "booking created",
      booking_id: booking_id
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "error creating booking"
    });

  }

});

// GET /bookings/user
// ดึงรายการ booking ทั้งหมดของ user ที่ login อยู่
// ใช้ aggregate + lookup เพื่อ join vehicles

app.get("/bookings/user", authMiddleware, async (req, res) => {

  const db = mongoose.connection.collection("bookings");

  try {

    // user_id มาจาก token ที่ middleware decode ไว้
    const userId = req.user.user_id;

    // aggregate query
    const result = await db.aggregate([

      // 1️⃣ filter booking ของ user คนนี้
      {
        $match: {
          user_id: userId
        }
      },

      // 2️⃣ join vehicles collection
      {
        $lookup: {
          from: "vehicles",           // collection ที่จะ join
          localField: "vehicle_id",   // field ใน bookings
          foreignField: "vehicle_id", // field ใน vehicles
          as: "vehicle"
        }
      },

      // 3️⃣ แปลง array vehicle ให้เป็น object
      {
        $unwind: "$vehicle"
      },

      // 4️⃣ เรียงตามวันที่จองล่าสุด
      {
        $sort: {
          booking_datetime: -1
        }
      },

      // 5️⃣ เลือก field ที่ต้องการส่งกลับ
      {
        $project: {
          _id: 0,
          booking_id: 1,
          booking_datetime: 1,
          status: 1,

          "vehicle.brand": 1,
          "vehicle.model": 1,
          "vehicle.license_plate": 1
        }
      }

    ]).toArray();

    res.json(result);

  } catch (error) {

    res.status(500).json({
      message: "error fetching bookings"
    });

  }

});

// GET /bookings/:id
// ดึงรายละเอียด booking พร้อมข้อมูลรถ และบริการที่เลือก

app.get("/bookings/:id", authMiddleware, async (req, res) => {

  const db = mongoose.connection.collection("bookings");

  try {

    // รับ booking_id จาก URL
    const bookingId = parseInt(req.params.id);

    const result = await db.aggregate([

      // 1️⃣ หา booking ตาม id
      {
        $match: {
          booking_id: bookingId
        }
      },

      // 2️⃣ join vehicles
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "vehicle_id",
          as: "vehicle"
        }
      },

      {
        $unwind: "$vehicle"
      },

      // 3️⃣ join booking_services
      {
        $lookup: {
          from: "booking_services",
          localField: "booking_id",
          foreignField: "booking_id",
          as: "booking_services"
        }
      },

      // 4️⃣ join service เพื่อเอา service_name
      {
        $lookup: {
          from: "service",
          localField: "booking_services.service_id",
          foreignField: "service_id",
          as: "services"
        }
      },

      // 5️⃣ format ข้อมูล
      {
        $project: {
          _id: 0,
          booking_id: 1,
          status: 1,
          booking_datetime: 1,

          checkin_note: 1,
          staff_note: 1,
          started_at: 1,
          finished_at: 1,

          vehicle: {
            brand: "$vehicle.brand",
            model: "$vehicle.model",
            license_plate: "$vehicle.license_plate"
          },

          services: {
            $map: {
              input: "$booking_services",
              as: "bs",
              in: {
                service_id: "$$bs.service_id",
                price: "$$bs.price_at_booking"
              }
            }
          }
        }
      }
    ]).toArray();

    if (result.length === 0) {
      return res.status(404).json({
        message: "booking not found"
      });
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({
      message: "error fetching booking"
    });
  }
});
// DELETE /bookings/:id
// ใช้สำหรับยกเลิก / ลบ booking

app.delete("/bookings/:id", authMiddleware, async (req, res) => {

  // เชื่อมต่อ collection ต่าง ๆ
  const bookings = mongoose.connection.collection("bookings");
  const booking_services = mongoose.connection.collection("booking_services");

  try {

    // รับ booking_id จาก URL
    const bookingId = parseInt(req.params.id);

    // -----------------------------
    // ตรวจสอบว่ามี booking นี้อยู่ไหม
    // -----------------------------
    const booking = await bookings.findOne({
      booking_id: bookingId
    });

    if (!booking) {
      return res.status(404).json({
        message: "booking not found"
      });
    }

    // -----------------------------
    // ลบ booking_services ที่เกี่ยวข้อง
    // -----------------------------
    await booking_services.deleteMany({
      booking_id: bookingId
    });

    // -----------------------------
    // ลบ booking หลัก
    // -----------------------------
    await bookings.deleteOne({
      booking_id: bookingId
    });

    // ส่ง response กลับ
    res.json({
      message: "booking deleted",
      booking_id: bookingId
    });

  } catch (error) {

    res.status(500).json({
      message: "error deleting booking"
    });

  }

});
// PUT /bookings/:id
// ใช้สำหรับพนักงาน update สถานะการล้างรถ
// เช่น เริ่มล้าง หรือ ล้างเสร็จ

// PUT /bookings/:id
// ใช้สำหรับพนักงาน update สถานะการล้างรถ
// เช่น เริ่มล้าง หรือ ล้างเสร็จ

app.put("/bookings/:id", authMiddleware, async (req, res) => {

  // เชื่อมต่อ collection bookings
  const db = mongoose.connection.collection("bookings");

  try {

    // รับ booking_id จาก URL
    const bookingId = parseInt(req.params.id);

    // รับข้อมูลจาก frontend
    const { status, checkin_note, staff_note } = req.body;

    // object สำหรับเก็บ field ที่จะ update
    let updateData = {};

    // -----------------------------
    // กรณีพนักงานเริ่มล้างรถ
    // -----------------------------
    if (status === "in_progress") {

      updateData.status = "in_progress";  // เปลี่ยนสถานะเป็นกำลังล้าง

      // ถ้ามี note จาก frontend ให้บันทึก
      if (checkin_note) {
        updateData.checkin_note = checkin_note;
      }

      // backend บันทึกเวลาเริ่มล้าง
      updateData.started_at = new Date();

    }

    // -----------------------------
    // กรณีพนักงานล้างรถเสร็จ
    // -----------------------------
    if (status === "completed") {

      updateData.status = "completed";  // เปลี่ยนสถานะเป็นเสร็จแล้ว

      // ถ้ามี note จากพนักงาน
      if (staff_note) {
        updateData.staff_note = staff_note;
      }

      // backend บันทึกเวลาสิ้นสุด
      updateData.finished_at = new Date();

    }

    // update booking ใน MongoDB
    const result = await db.updateOne(
      { booking_id: bookingId }, // หา booking ตาม id
      { $set: updateData }       // update เฉพาะ field ที่ต้องการ
    );

    // ถ้าไม่พบ booking
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "booking not found"
      });
    }

    // ส่ง response กลับ
    res.json({
      message: "booking updated",
      booking_id: bookingId
    });

  } catch (error) {

    // error server
    res.status(500).json({
      message: "error updating booking"
    });

  }

});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});