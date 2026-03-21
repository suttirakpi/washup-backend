const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");


//role customer 
// API สำหรับเพิ่มข้อมูลรถ หน้า Add Vehicle (เพิ่มรถ)
router.post("/", authMiddleware, async (req, res) => {
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
router.get("/user", authMiddleware, async (req, res) => {
  const db = mongoose.connection.collection("vehicles");

  try {
    // ดึง user_id จาก token
    const userId = req.user.user_id;

    // ค้นหารถทั้งหมดของ user
    const vehicles = await db.find({ user_id: userId }).toArray();

    // ถ้าไม่มีรถ
  if (vehicles.length === 0) {
    return res.json([]); // 🔥 ส่ง array ว่างแทน
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
router.put("/:id", authMiddleware, async (req, res) => {

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

//role customer
// API สำหรับลบรถ
router.delete("/:id", authMiddleware, async (req, res) => {

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

module.exports = router;