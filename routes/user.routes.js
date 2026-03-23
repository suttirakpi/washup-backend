const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/auth");
const { SECRET } = require("../config/auth");


// API สำหรับ Users (ผู้ใช้)//
//role public
router.post("/register", async (req, res) => {
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
router.post("/login", async (req, res) => {
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
    user_role: user.user_role
    },
    SECRET,
    {
    expiresIn: "1h",
    }
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

//role customer adim staff
// API สำหรับดึงข้อมูลผู้ใช้ตาม user_id ทำส่วนหน้าโปรไฟล์ของผู้ใช้
router.get("/:id", authMiddleware, async (req, res) => {
  // เชื่อม collection users ใน MongoDB
  const db = mongoose.connection.collection("users");

  try {
    // รับค่า id จาก URL เช่น /users/1001
    const userId = parseInt(req.params.id);

    // ตรวจสอบสิทธิ์
     if (req.user.user_id !== userId && req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }
    
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
router.put("/:id", authMiddleware, async (req, res) => {
  // เชื่อม collection users
  const db = mongoose.connection.collection("users");
  try {
    // รับ user_id จาก URL
    const userId = parseInt(req.params.id);

    // ตรวจสอบสิทธิ์
    if (req.user.user_id !== userId && req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

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

module.exports = router;