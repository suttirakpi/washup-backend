const express = require("express"); // ใช้สร้าง API Server
const mongoose = require("mongoose"); // ใช้เชื่อมต่อ MongoDB

const app = express(); // สร้างตัวแอป server
app.use(express.json());

// เชื่อมต่อ Database
mongoose.connect("mongodb://127.0.0.1:27017/carwashDB");

const bcrypt = require("bcrypt"); // ใช้เข้ารหัสรหัสผ่าน ทำให้คนอื่นไม่สามารถเห็นรหัสผ่านจริงได้
const jwt = require("jsonwebtoken"); // ใช้สร้าง token สำหรับ authentication
const SECRET = "mysecretkey"; // key สำหรับเข้ารหัส token
const cors = require("cors");
app.use(cors()); // อนุญาตให้ Frontend ยิง API เข้ามาได้

// API สำหรับ Users (ผู้ใช้)//

app.post("/users/register", async (req, res) => {
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
  const token = req.headers.authorization; // รับ token จาก header

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




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

//1
