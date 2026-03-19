const express = require("express"); // ใช้สร้าง API Server
const mongoose = require("mongoose"); // ใช้เชื่อมต่อ MongoDB
const path = require("path");
const fs = require("fs");

const app = express(); // สร้างตัวแอป server
app.use(express.json());

// เชื่อมต่อ Database
mongoose.connect("mongodb://127.0.0.1:27017/carwashDB");

const bcrypt = require("bcrypt"); // ใช้เข้ารหัสรหัสผ่าน ทำให้คนอื่นไม่สามารถเห็นรหัสผ่านจริงได้
const jwt = require("jsonwebtoken"); // ใช้สร้าง token สำหรับ authentication
const SECRET = "mysecretkey"; // key สำหรับเข้ารหัส token
const cors = require("cors");
app.use(cors()); // อนุญาต CORS

const defaultDist = path.join(__dirname, "dist");
const reactDist = path.join(__dirname, "my-washup-react", "dist");
const staticDir = fs.existsSync(defaultDist) ? defaultDist : reactDist;

app.use(express.static(staticDir)); // อนุญาตให้ Frontend ยิง API เข้ามาได้

// Fallback สำหรับ SPA (ถ้าใช้ React Router)
app.get("*", (req, res) => {
  const indexHtml = path.join(staticDir, "index.html");
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  res.status(404).send("Not Found");
});

// API สำหรับ Users (ผู้ใช้)//
//role public
app.post("/api/users/register", async (req, res) => {
  //ใช้สำหรับลงทะเบียนผู้ใช้ใหม่ โดยรับข้อมูลจาก client ผ่าน HTTP POST และบันทึกลงใน MongoDB
  const db = mongoose.connection.collection("users");

  try {
    //เช็คข้อมูลครบไหมหรือไม่
    if (
      !req.body.login_name ||
      !req.body.login_password ||
      !req.body.fullname ||
      !req.body.phone
    ) {
      return res.status(400).json({ message: "please fill all fields" });
    }

    //ตรวจสอบความแข็งแรงของรหัสผ่าน
    const password = req.body.login_password;
    const strongPassword = /^(?=.*[A-Z])(?=.*[!@#$%]).{8,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters, include 1 uppercase letter and 1 special character",
      });
    }

    //เช็คว่ามี username ซ้ำไหม
    const existingUser = await db.findOne({ login_name: req.body.login_name });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

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
//role public
app.post("/api/users/login", async (req, res) => {
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

    // สร้าง token และเก็บ role ไว้ด้วย
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_role: user.user_role,
      },
      SECRET,
      {
        expiresIn: "1h",
      },
    );
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

//role customer adim staff
// API สำหรับดึงข้อมูลผู้ใช้ตาม user_id ทำส่วนหน้าโปรไฟล์ของผู้ใช้
app.get("/api/users/:id", authMiddleware, async (req, res) => {
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

//role customer adim staff
// API สำหรับแก้ไขข้อมูลผู้ใช้ ทำส่วนหน้าโปรไฟล์ของผู้ใช้
app.put("/api/users/:id", authMiddleware, async (req, res) => {
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

//role customer
// API สำหรับเพิ่มข้อมูลรถ หน้า Add Vehicle (เพิ่มรถ)
app.post("/api/vehicles", authMiddleware, async (req, res) => {
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

//role customer
// API สำหรับดึงรถทั้งหมดของ user (ใช้ token)
app.get("/api/vehicles/user", authMiddleware, async (req, res) => {
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

//role customer
// API สำหรับแก้ไขข้อมูลรถ
app.put("/api/vehicles/:id", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("vehicles");

  try {
    // รับ vehicle_id จาก URL
    const vehicleId = parseInt(req.params.id);

    // รับข้อมูลใหม่จาก body
    const { vehicle_type_id, license_plate, brand, model, color, note } =
      req.body;

    // ตรวจว่ามีข้อมูลส่งมาหรือไม่
    if (!vehicle_type_id || !license_plate || !brand || !model || !color) {
      return res.status(400).json({
        message: "please fill all fields except note",
      });
    }

    // อัปเดตข้อมูลรถ (แก้ได้เฉพาะรถของ user ที่ login)
    const result = await db.updateOne(
      {
        vehicle_id: vehicleId,
        user_id: req.user.user_id,
      },
      {
        $set: {
          vehicle_type_id: parseInt(vehicle_type_id),
          license_plate: license_plate,
          brand: brand,
          model: model,
          color: color,
          note: note,
        },
      },
    );

    // ถ้าไม่พบรถ หรือไม่ใช่เจ้าของรถ
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "vehicle not found or not your vehicle",
      });
    }

    // ส่งผลกลับไป
    res.json({
      message: "vehicle updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "server error",
    });
  }
});

//role customer
// API สำหรับลบรถ
app.delete("/api/vehicles/:id", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("vehicles");

  try {
    // รับ vehicle_id จาก URL
    const vehicleId = parseInt(req.params.id);

    // ลบเฉพาะรถของ user ที่ login
    const result = await db.deleteOne({
      vehicle_id: vehicleId,
      user_id: req.user.user_id,
    });

    // ถ้าไม่พบรถ
    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "vehicle not found or not your vehicle",
      });
    }

    // ส่งผลลัพธ์กลับ
    res.json({
      message: "vehicle deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "server error",
    });
  }
});

// role: admin
// API สำหรับเพิ่มแพ็กเกจบริการใหม่ (ใช้ในหน้า owner จัดการแพ็กเกจ)

// owner เพิ่ม service
app.post("/api/service", authMiddleware, async (req, res) => {
  const serviceDB = mongoose.connection.collection("service");
  const priceDB = mongoose.connection.collection("service_prices");

  try {
    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const { service_name, description, vehicle_type_id, price } = req.body;

    // หา service id ใหม่
    const lastService = await serviceDB
      .find({})
      .sort({ service_id: -1 })
      .limit(1)
      .toArray();

    const service_id =
      lastService.length > 0 ? lastService[0].service_id + 1 : 3001;

    await serviceDB.insertOne({
      service_id,
      service_name,
      description,
      is_active: true,
    });

    // หา price id ใหม่
    const lastPrice = await priceDB
      .find({})
      .sort({ service_price_id: -1 })
      .limit(1)
      .toArray();

    const service_price_id =
      lastPrice.length > 0 ? lastPrice[0].service_price_id + 1 : 5001;

    await priceDB.insertOne({
      service_price_id,
      service_id,
      vehicle_type_id,
      price,
    });

    res.json({
      message: "service created",
      service_id,
    });
  } catch (error) {
    res.status(500).json({
      message: "error creating service",
    });
  }
});

//role public
//services // API สำหรับดึงข้อมูลประเภทบริการล้างรถทั้งหมด
app.get("/api/services", async (req, res) => {
  const serviceDB = mongoose.connection.collection("service");

  try {
    const services = await serviceDB
      .aggregate([
        // เอาเฉพาะ service ที่เปิดใช้งาน
        {
          $match: { is_active: true },
        },

        // join ตาราง service_prices
        {
          $lookup: {
            from: "service_prices",
            localField: "service_id",
            foreignField: "service_id",
            as: "prices",
          },
        },

        // join ตาราง vehicle_type
        {
          $lookup: {
            from: "vehicle_type",
            localField: "prices.vehicle_type_id",
            foreignField: "vehicle_type_id",
            as: "vehicle_types",
          },
        },
      ])
      .toArray();

    res.json(services);
  } catch (error) {
    res.status(500).json({
      message: "error fetching services",
    });
  }
});
// owner ใช้จัดการ service
app.get("/api/services/admin", authMiddleware, async (req, res) => {
  const serviceDB = mongoose.connection.collection("service");

  try {
    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const services = await serviceDB
      .aggregate([
        {
          $lookup: {
            from: "service_prices",
            localField: "service_id",
            foreignField: "service_id",
            as: "prices",
          },
        },
      ])
      .toArray();

    res.json(services);
  } catch (error) {
    res.status(500).json({
      message: "error fetching services",
    });
  }
});

// owner แก้ service
app.put("/api/service/:id", authMiddleware, async (req, res) => {
  const serviceDB = mongoose.connection.collection("service");
  const priceDB = mongoose.connection.collection("service_prices");

  try {
    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const serviceId = parseInt(req.params.id);

    const { service_name, description, price } = req.body;

    await serviceDB.updateOne(
      { service_id: serviceId },
      {
        $set: {
          service_name,
          description,
        },
      },
    );

    await priceDB.updateOne(
      { service_id: serviceId },
      {
        $set: { price },
      },
    );

    res.json({
      message: "service updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "error updating service",
    });
  }
});

// owner ลบ service
app.delete("/api/service/:id", authMiddleware, async (req, res) => {
  const serviceDB = mongoose.connection.collection("service");
  const priceDB = mongoose.connection.collection("service_prices");

  try {
    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const serviceId = parseInt(req.params.id);

    // ลบราคา
    await priceDB.deleteMany({
      service_id: serviceId,
    });

    // ลบบริการ
    await serviceDB.deleteOne({
      service_id: serviceId,
    });

    res.json({
      message: "service deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "error deleting service",
    });
  }
});

// role: admin
// API สำหรับแก้ไขแพ็กเกจบริการ

app.put("/api/service/:id", authMiddleware, async (req, res) => {
  // เชื่อม collection service
  const db = mongoose.connection.collection("service");

  try {
    //  ตรวจ role ต้องเป็น admin
    if (req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    //  รับ service_id จาก URL
    const serviceId = parseInt(req.params.id);

    //  รับข้อมูลใหม่จาก frontend
    const { service_name, description, is_active } = req.body;

    //  update service ใน database
    const result = await db.updateOne(
      { service_id: serviceId }, // หา service ที่ต้องการแก้
      {
        $set: {
          service_name: service_name,
          description: description,
          is_active: is_active,
        },
      },
    );

    //  ถ้าไม่พบ service
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "service not found",
      });
    }

    //  ส่งผลลัพธ์กลับ
    res.json({
      message: "service updated",
    });
  } catch (error) {
    //  error server
    res.status(500).json({
      message: "error updating service",
    });
  }
});

// role: admin
// API สำหรับลบแพ็กเกจบริการ

app.delete("/api/service/:id", authMiddleware, async (req, res) => {
  // เชื่อม collection service
  const db = mongoose.connection.collection("service");

  try {
    // 🔒 ตรวจ role ต้องเป็น admin
    if (req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    // 📌 รับ service_id จาก URL
    const serviceId = parseInt(req.params.id);

    // 🗑 ลบ service
    const result = await db.deleteOne({
      service_id: serviceId,
    });

    // ❗ ถ้าไม่พบ service
    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "service not found",
      });
    }

    // 📤 ส่งผลลัพธ์กลับ
    res.json({
      message: "service deleted",
    });
  } catch (error) {
    // ❌ error server
    res.status(500).json({
      message: "error deleting service",
    });
  }
});

// role: public
// API ดึงรายการประเภทรถทั้งหมด

app.get("/api/vehicle-types", async (req, res) => {
  const db = mongoose.connection.collection("vehicle_type");

  try {
    // ดึงข้อมูลทั้งหมด
    const vehicleTypes = await db.find({}).toArray();

    res.json(vehicleTypes);
  } catch (error) {
    res.status(500).json({
      message: "error fetching vehicle types",
    });
  }
});

// role: admin
// API เพิ่มประเภทรถใหม่

app.post("/api/vehicle-types", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("vehicle_type");

  try {
    // ตรวจ role ต้องเป็น admin
    if (req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    const { vehicle_type_name } = req.body;

    // ตรวจข้อมูล
    if (!vehicle_type_name) {
      return res.status(400).json({
        message: "vehicle_type_name required",
      });
    }

    // หา id ล่าสุด
    const lastType = await db
      .find({})
      .sort({ vehicle_type_id: -1 })
      .limit(1)
      .toArray();

    const vehicle_type_id =
      lastType.length > 0 ? lastType[0].vehicle_type_id + 1 : 1;

    // insert
    await db.insertOne({
      vehicle_type_id: vehicle_type_id,
      vehicle_type_name: vehicle_type_name,
    });

    res.json({
      message: "vehicle type created",
      vehicle_type_id: vehicle_type_id,
    });
  } catch (error) {
    res.status(500).json({
      message: "error creating vehicle type",
    });
  }
});

// role: admin
// API แก้ไขประเภทรถ

app.put("/api/vehicle-types/:id", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("vehicle_type");

  try {
    if (req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    const vehicleTypeId = parseInt(req.params.id);
    const { vehicle_type_name } = req.body;

    if (!vehicle_type_name) {
      return res.status(400).json({
        message: "vehicle_type_name required",
      });
    }

    const result = await db.updateOne(
      { vehicle_type_id: vehicleTypeId },
      {
        $set: {
          vehicle_type_name: vehicle_type_name,
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "vehicle type not found",
      });
    }

    res.json({
      message: "vehicle type updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "error updating vehicle type",
    });
  }
});

// role: admin
// API ลบประเภทรถ

app.delete("/api/vehicle-types/:id", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("vehicle_type");

  try {
    if (req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    const vehicleTypeId = parseInt(req.params.id);

    const result = await db.deleteOne({
      vehicle_type_id: vehicleTypeId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "vehicle type not found",
      });
    }

    res.json({
      message: "vehicle type deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "error deleting vehicle type",
    });
  }
});

//role customer
// POST /bookings
// สร้าง booking และ booking_services โดยให้ id เพิ่มเอง
app.post("/api/bookings", authMiddleware, async (req, res) => {
  const bookings = mongoose.connection.collection("bookings");
  const booking_services = mongoose.connection.collection("booking_services");
  const vehicles = mongoose.connection.collection("vehicles");
  const service_prices = mongoose.connection.collection("service_prices");

  try {
    const { vehicle_id, booking_datetime, services } = req.body;
    if (!vehicle_id || !booking_datetime) {
      return res.status(400).json({
        message: "vehicle_id and booking_datetime required",
      });
    }

    // ตรวจว่าต้องมี service อย่างน้อย 1 รายการ
    if (!services || services.length === 0) {
      return res.status(400).json({
        message: "at least one service required",
      });
    }
    // -----------------------------
    // สร้าง booking_id อัตโนมัติ
    // -----------------------------
    const lastBooking = await bookings
      .find({})
      .sort({ booking_id: -1 })
      .limit(1)
      .toArray();

    const booking_id =
      lastBooking.length > 0 ? lastBooking[0].booking_id + 1 : 4001;

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
      status: "pending",
    });

    // -----------------------------
    // loop services
    // -----------------------------
    for (let service_id of services) {
      // หา price จาก service_prices
      const priceData = await service_prices.findOne({
        service_id: service_id,
        vehicle_type_id: vehicleTypeId,
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
        lastService.length > 0 ? lastService[0].booking_service_id + 1 : 7001;

      // insert booking_services
      await booking_services.insertOne({
        booking_service_id: booking_service_id,
        booking_id: booking_id,
        service_id: service_id,
        price_at_booking: priceData.price,
      });
    }

    res.json({
      message: "booking created",
      booking_id: booking_id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "error creating booking",
    });
  }
});

//role customer
// GET /bookings/user
// ดึงรายการ booking ทั้งหมดของ user ที่ login อยู่

app.get("/api/bookings/user", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("bookings");

  try {
    // user_id มาจาก token ที่ middleware decode ไว้
    const userId = req.user.user_id;

    // aggregate query
    const result = await db
      .aggregate([
        // 1️⃣ filter booking ของ user คนนี้
        {
          $match: {
            user_id: userId,
          },
        },

        // 2️⃣ join vehicles collection
        {
          $lookup: {
            from: "vehicles", // collection ที่จะ join
            localField: "vehicle_id", // field ใน bookings
            foreignField: "vehicle_id", // field ใน vehicles
            as: "vehicle",
          },
        },

        // 3️⃣ แปลง array vehicle ให้เป็น object
        {
          $unwind: "$vehicle",
        },

        // 4️⃣ เรียงตามวันที่จองล่าสุด
        {
          $sort: {
            booking_datetime: 1,
          },
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
            "vehicle.license_plate": 1,
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "error fetching bookings",
    });
  }
});

//role customer
// GET /bookings/:id
// ดึงรายละเอียด booking พร้อมข้อมูลรถ และบริการที่เลือก

app.get("/api/bookings/:id", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("bookings");

  try {
    // รับ booking_id จาก URL
    const bookingId = parseInt(req.params.id);

    const result = await db
      .aggregate([
        // 1️⃣ หา booking ตาม id
        {
          $match: {
            booking_id: bookingId,
            user_id: req.user.user_id,
          },
        },

        // 2️⃣ join vehicles
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle_id",
            foreignField: "vehicle_id",
            as: "vehicle",
          },
        },

        {
          $unwind: "$vehicle",
        },

        // 3️⃣ join booking_services
        {
          $lookup: {
            from: "booking_services",
            localField: "booking_id",
            foreignField: "booking_id",
            as: "booking_services",
          },
        },

        // 4️⃣ join service เพื่อเอา service_name
        {
          $lookup: {
            from: "service",
            localField: "booking_services.service_id",
            foreignField: "service_id",
            as: "services",
          },
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
              license_plate: "$vehicle.license_plate",
            },

            services: {
              $map: {
                input: "$booking_services",
                as: "bs",
                in: {
                  service_id: "$$bs.service_id",
                  price: "$$bs.price_at_booking",
                },
              },
            },
          },
        },
      ])
      .toArray();

    if (result.length === 0) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({
      message: "error fetching booking",
    });
  }
});

//role customer
// DELETE /bookings/:id
// ใช้สำหรับยกเลิก / ลบ booking

app.delete("/api/bookings/:id", authMiddleware, async (req, res) => {
  // เชื่อมต่อ collectionF ต่าง ๆ
  const bookings = mongoose.connection.collection("bookings");
  const booking_services = mongoose.connection.collection("booking_services");

  try {
    // รับ booking_id จาก URL
    const bookingId = parseInt(req.params.id);

    // -----------------------------F
    // ตรวจสอบว่ามี booking นี้อยู่ไหม
    // -----------------------------
    const booking = await bookings.findOne({
      booking_id: bookingId,
      user_id: req.user.user_id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    // -----------------------------
    // ลบ booking_services ที่เกี่ยวข้อง
    // -----------------------------
    await booking_services.deleteMany({
      booking_id: bookingId,
    });

    // -----------------------------
    // ลบ booking หลัก
    // -----------------------------
    await bookings.deleteOne({
      booking_id: bookingId,
    });

    // ส่ง response กลับ
    res.json({
      message: "booking deleted",
      booking_id: bookingId,
    });
  } catch (error) {
    res.status(500).json({
      message: "error deleting booking",
    });
  }
});

//role staff admin
// staff หรือ admin ดู booking ทั้งหมด
app.get("/api/bookings", authMiddleware, async (req, res) => {
  const bookings = mongoose.connection.collection("bookings");

  try {
    if (req.user.user_role !== "staff" && req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    const result = await bookings
      .aggregate([
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle_id",
            foreignField: "vehicle_id",
            as: "vehicle",
          },
        },

        {
          $unwind: "$vehicle",
        },

        {
          $project: {
            _id: 0,
            booking_id: 1,
            booking_datetime: 1,
            status: 1,

            "vehicle.brand": 1,
            "vehicle.model": 1,
            "vehicle.license_plate": 1,
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "error fetching bookings",
    });
  }
});

//role public customer
// ใช้ดูว่ามี booking ในแต่ละช่วงเวลากี่คัน
app.get("/api/booking-slots", async (req, res) => {
  // เชื่อม collection bookings
  const db = mongoose.connection.collection("bookings");

  try {
    // aggregate เพื่อ group ตามเวลา
    const slots = await db
      .aggregate([
        {
          $group: {
            _id: "$booking_datetime", // group ตามเวลาจอง
            total_bookings: { $sum: 1 }, // นับจำนวน
          },
        },

        {
          $sort: {
            _id: 1, // เรียงตามเวลา
          },
        },
      ])
      .toArray();

    // ส่งข้อมูลกลับ
    res.json(slots);
  } catch (error) {
    res.status(500).json({
      message: "error fetching slots",
    });
  }
});

//role staff admin
// ใช้สำหรับพนักงาน update สถานะการล้างรถ
// เช่น เริ่มล้าง หรือ ล้างเสร็จ

app.put("/api/bookings/:id", authMiddleware, async (req, res) => {
  // เชื่อมต่อ collection bookings
  const db = mongoose.connection.collection("bookings");

  try {
    // ตรวจ role
    if (req.user.user_role !== "staff" && req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    // รับ booking_id จาก URL
    const bookingId = parseInt(req.params.id);

    // รับข้อมูลจาก frontend
    const { status, checkin_note, staff_note } = req.body;

    // object สำหรับเก็บ field ที่จะ update
    let updateData = {};
    // staff ยืนยันคิว
    if (status === "confirmed") {
      updateData.status = "confirmed";
    }

    // -----------------------------
    // กรณีพนักงานเริ่มล้างรถ
    // -----------------------------
    if (status === "in_progress") {
      updateData.status = "in_progress"; // เปลี่ยนสถานะเป็นกำลังล้าง

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
      updateData.status = "completed"; // เปลี่ยนสถานะเป็นเสร็จแล้ว

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
      { $set: updateData }, // update เฉพาะ field ที่ต้องการ
    );

    // ถ้าไม่พบ booking
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    // ส่ง response กลับ
    res.json({
      message: "booking updated",
      booking_id: bookingId,
    });
  } catch (error) {
    // error server
    res.status(500).json({
      message: "error updating booking",
    });
  }
});

//role customer
// ใช้สำหรับให้ลูกค้าให้คะแนนหลังล้างรถเสร็จ

app.post("/api/reviews", authMiddleware, async (req, res) => {
  // เชื่อมต่อ collection reviews
  const reviews = mongoose.connection.collection("reviews");

  // เชื่อม collection bookings เพื่อเช็คว่า booking นี้มีอยู่จริงไหม
  const bookings = mongoose.connection.collection("bookings");

  try {
    // รับข้อมูลจาก frontend
    const { booking_id, rating, comment } = req.body;

    // -----------------------------
    // ตรวจสอบว่ามีข้อมูลจำเป็นไหม
    // -----------------------------
    if (!booking_id || !rating) {
      return res.status(400).json({
        message: "booking_id and rating are required",
      });
    }

    // -----------------------------
    // ตรวจว่า booking นี้มีอยู่จริงไหม
    // และเป็นของ user คนนี้หรือไม่
    // -----------------------------
    const booking = await bookings.findOne({
      booking_id: booking_id,
      user_id: req.user.user_id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    // -----------------------------
    // สร้าง review_id อัตโนมัติ
    // -----------------------------
    const lastReview = await reviews
      .find({})
      .sort({ review_id: -1 }) // เรียงจากมากไปน้อย
      .limit(1)
      .toArray();

    // ถ้ามี review อยู่แล้ว → +1
    const review_id =
      lastReview.length > 0 ? lastReview[0].review_id + 1 : 5001;

    // -----------------------------
    // บันทึกข้อมูล review ลง MongoDB
    // -----------------------------
    await reviews.insertOne({
      review_id: review_id,
      booking_id: booking_id,
      rating: rating,
      comment: comment || "", // ถ้าไม่มี comment ให้เป็น string ว่าง
      created_at: new Date(), // เวลาที่รีวิว
    });

    // ส่ง response กลับ
    res.json({
      message: "review created successfully",
      review_id: review_id,
    });
  } catch (error) {
    // ถ้า server error
    res.status(500).json({
      message: "error creating review",
    });
  }
});

//role public
// ใช้สำหรับดึงรีวิวทั้งหมดในระบบ

app.get("/api/reviews", async (req, res) => {
  // เชื่อม collection reviews
  const reviews = mongoose.connection.collection("reviews");

  try {
    // aggregate ใช้ join bookings เพื่อดูข้อมูลการจอง
    const result = await reviews
      .aggregate([
        {
          $lookup: {
            from: "bookings", // join collection bookings
            localField: "booking_id", // field ใน reviews
            foreignField: "booking_id", // field ใน bookings
            as: "booking",
          },
        },

        // แปลง booking array → object
        { $unwind: "$booking" },

        // เลือก field ที่ต้องการส่งกลับ
        {
          $project: {
            _id: 0,
            review_id: 1,
            booking_id: 1,
            rating: 1,
            comment: 1,
            created_at: 1,
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "error fetching reviews",
    });
  }
});

//role staff admin
// ใช้สำหรับบันทึกการชำระเงินของ booking
app.post("/api/payments", authMiddleware, async (req, res) => {
  // collection ที่ต้องใช้
  const payments = mongoose.connection.collection("payments");
  const bookings = mongoose.connection.collection("bookings");
  const booking_services = mongoose.connection.collection("booking_services");

  try {
    // รับข้อมูลจาก frontend
    const { booking_id, payment_method } = req.body;

    // ----------------------------
    // ตรวจข้อมูลที่จำเป็น
    // ----------------------------
    if (!booking_id || !payment_method) {
      return res.status(400).json({
        message: "booking_id and payment_method required",
      });
    }

    //  ตรวจว่า booking มีอยู่จริงไหม

    const booking = await bookings.findOne({
      booking_id: booking_id,
    });

    if (!booking) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    // 2️⃣ ตรวจว่างานเสร็จหรือยัง
    // ต้องเป็น status = completed

    if (booking.status !== "completed") {
      return res.status(400).json({
        message: "service not completed yet",
      });
    }

    //  ตรวจว่าจ่ายแล้วหรือยัง

    const existingPayment = await payments.findOne({
      booking_id: booking_id,
    });

    if (existingPayment) {
      return res.status(400).json({
        message: "booking already paid",
      });
    }

    //  คำนวณราคาจาก booking_services
    const services = await booking_services
      .find({
        booking_id: booking_id,
      })
      .toArray();

    let total_amount = 0;

    for (let s of services) {
      total_amount += s.price_at_booking;
    }

    //  สร้าง payment_id ใหม่

    const lastPayment = await payments
      .find({})
      .sort({ payment_id: -1 })
      .limit(1)
      .toArray();

    const payment_id =
      lastPayment.length > 0 ? lastPayment[0].payment_id + 1 : 8001;

    // บันทึก payment

    await payments.insertOne({
      payment_id: payment_id,
      booking_id: booking_id,
      total_amount: total_amount,
      payment_method: payment_method,
      payment_status: "paid",
      paid_at: new Date(),
    });

    // ส่งผลลัพธ์กลับ
    res.json({
      message: "payment success",
      total_amount: total_amount,
    });
  } catch (error) {
    res.status(500).json({
      message: "error creating payment",
    });
  }
});

//role staff admin customer
// ใช้ดูการชำระเงินของ booking
app.get("/api/payments/:booking_id", authMiddleware, async (req, res) => {
  const payments = mongoose.connection.collection("payments");

  try {
    // รับ booking_id จาก URL
    const bookingId = parseInt(req.params.booking_id);

    // ค้นหา payment
    const payment = await payments.findOne({
      booking_id: bookingId,
    });

    // ถ้าไม่พบ
    if (!payment) {
      return res.status(404).json({
        message: "payment not found",
      });
    }

    // ส่งข้อมูลกลับ
    res.json(payment);
  } catch (error) {
    res.status(500).json({
      message: "error fetching payment",
    });
  }
});

//role staff admin
// ดูรายการ payment ทั้งหมด (เฉพาะ admin / staff)
app.get("/api/payments", authMiddleware, async (req, res) => {
  const payments = mongoose.connection.collection("payments");

  try {
    // -----------------------------
    // เช็ค role ก่อน
    // -----------------------------
    if (req.user.user_role !== "admin" && req.user.user_role !== "staff") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    // ดึง payment ทั้งหมด
    const result = await payments.find({}).toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "error fetching payments",
    });
  }
});

// role: admin
// API สำหรับหน้า Owner Dashboard
// ใช้แสดงรายได้รวม จำนวนรถที่ล้างเสร็จ การยกเลิก และรายการล่าสุด

app.get("/api/dashboard/revenue", authMiddleware, async (req, res) => {
  const payments = mongoose.connection.collection("payments");
  const bookings = mongoose.connection.collection("bookings");

  try {
    // ตรวจ role ต้องเป็น admin
    if (req.user.user_role !== "admin") {
      return res.status(403).json({
        message: "access denied",
      });
    }

    // ---------------------------
    // 1️⃣ คำนวณรายได้รวม
    // ---------------------------
    const revenueResult = await payments
      .aggregate([
        {
          $group: {
            _id: null,
            total_revenue: { $sum: "$total_amount" },
          },
        },
      ])
      .toArray();

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].total_revenue : 0;

    // ---------------------------
    // 2️⃣ จำนวนรถที่ล้างเสร็จ
    // ---------------------------
    const completedCars = await bookings.countDocuments({
      status: "completed",
    });

    // ---------------------------
    // 3️⃣ จำนวนการยกเลิก
    // ---------------------------
    const cancelledBookings = await bookings.countDocuments({
      status: "cancelled",
    });

    // ---------------------------
    // 4️⃣ รายการธุรกรรมล่าสุด
    // ---------------------------
    const recentTransactions = await payments
      .find({})
      .sort({ paid_at: -1 })
      .limit(5)
      .toArray();

    // ---------------------------
    // ส่งข้อมูลกลับ
    // ---------------------------
    res.json({
      total_revenue: totalRevenue,
      completed_cars: completedCars,
      cancelled_bookings: cancelledBookings,
      recent_transactions: recentTransactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "error fetching dashboard data",
    });
  }
});

// หน้า staff
app.get("/staff", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "staff", "index.html"));
});

// React router fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

//service-prices // API สำหรับดึงข้อมูลราคาบริการล้างรถทั้งหมด
app.get("/service-prices", async (req, res) => {
  const db = mongoose.connection.collection("service_prices");
  try {
    const prices = await db.find({}).toArray();
    res.json(prices);
  } catch (error) {
    res.status(500).json({
      message: "server error",
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

    const booking_id =
      lastBooking.length > 0 ? lastBooking[0].booking_id + 1 : 4001;

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
      status: "pending",
    });

    // -----------------------------
    // loop services
    // -----------------------------
    for (let service_id of services) {
      // หา price จาก service_prices
      const priceData = await service_prices.findOne({
        service_id: service_id,
        vehicle_type_id: vehicleTypeId,
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
        lastService.length > 0 ? lastService[0].booking_service_id + 1 : 7001;

      // insert booking_services
      await booking_services.insertOne({
        booking_service_id: booking_service_id,
        booking_id: booking_id,
        service_id: service_id,
        price_at_booking: priceData.price,
      });
    }

    res.json({
      message: "booking created",
      booking_id: booking_id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "error creating booking",
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
    const result = await db
      .aggregate([
        // 1️⃣ filter booking ของ user คนนี้
        {
          $match: {
            user_id: userId,
          },
        },

        // 2️⃣ join vehicles collection
        {
          $lookup: {
            from: "vehicles", // collection ที่จะ join
            localField: "vehicle_id", // field ใน bookings
            foreignField: "vehicle_id", // field ใน vehicles
            as: "vehicle",
          },
        },

        // 3️⃣ แปลง array vehicle ให้เป็น object
        {
          $unwind: "$vehicle",
        },

        // 4️⃣ เรียงตามวันที่จองล่าสุด
        {
          $sort: {
            booking_datetime: -1,
          },
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
            "vehicle.license_plate": 1,
          },
        },
      ])
      .toArray();

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "error fetching bookings",
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

    const result = await db
      .aggregate([
        // 1️⃣ หา booking ตาม id
        {
          $match: {
            booking_id: bookingId,
          },
        },

        // 2️⃣ join vehicles
        {
          $lookup: {
            from: "vehicles",
            localField: "vehicle_id",
            foreignField: "vehicle_id",
            as: "vehicle",
          },
        },

        {
          $unwind: "$vehicle",
        },

        // 3️⃣ join booking_services
        {
          $lookup: {
            from: "booking_services",
            localField: "booking_id",
            foreignField: "booking_id",
            as: "booking_services",
          },
        },

        // 4️⃣ join service เพื่อเอา service_name
        {
          $lookup: {
            from: "service",
            localField: "booking_services.service_id",
            foreignField: "service_id",
            as: "services",
          },
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
              license_plate: "$vehicle.license_plate",
            },

            services: {
              $map: {
                input: "$booking_services",
                as: "bs",
                in: {
                  service_id: "$$bs.service_id",
                  price: "$$bs.price_at_booking",
                },
              },
            },
          },
        },
      ])
      .toArray();

    if (result.length === 0) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    res.json(result[0]);
  } catch (error) {
    res.status(500).json({
      message: "error fetching booking",
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
      booking_id: bookingId,
    });

    if (!booking) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    // -----------------------------
    // ลบ booking_services ที่เกี่ยวข้อง
    // -----------------------------
    await booking_services.deleteMany({
      booking_id: bookingId,
    });

    // -----------------------------
    // ลบ booking หลัก
    // -----------------------------
    await bookings.deleteOne({
      booking_id: bookingId,
    });

    // ส่ง response กลับ
    res.json({
      message: "booking deleted",
      booking_id: bookingId,
    });
  } catch (error) {
    res.status(500).json({
      message: "error deleting booking",
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
      updateData.status = "in_progress"; // เปลี่ยนสถานะเป็นกำลังล้าง

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
      updateData.status = "completed"; // เปลี่ยนสถานะเป็นเสร็จแล้ว

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
      { $set: updateData }, // update เฉพาะ field ที่ต้องการ
    );

    // ถ้าไม่พบ booking
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "booking not found",
      });
    }

    // ส่ง response กลับ
    res.json({
      message: "booking updated",
      booking_id: bookingId,
    });
  } catch (error) {
    // error server
    res.status(500).json({
      message: "error updating booking",
    });
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
