const express = require("express"); // ใช้สร้าง API Server
const mongoose = require("mongoose"); // ใช้เชื่อมต่อ MongoDB

const app = express();// สร้างตัวแอป server
app.use(express.json());

// เชื่อมต่อ Database
mongoose.connect("mongodb://127.0.0.1:27017/carwashDB");

const bcrypt = require("bcrypt"); // ใช้เข้ารหัสรหัสผ่าน ทำให้คนอื่นไม่สามารถเห็นรหัสผ่านจริงได้
app.post("/users/register",async(req,res) => {
    const db = mongoose.connection.collection("users");

    try{

    //เช็คข้อมูลครบไหมหรือไม่
    if(!req.body.login_name || !req.body.login_password || !req.body.fullname || !req.body.phone){
        return res.status(400).json({message:"please fill all fields"});
    }

    //เช็คว่ามี username ซ้ำไหม
    const existingUser = await db.findOne({ login_name: req.body.login_name });
    if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
    } 

    // หา user ล่าสุด
    const lastUser = await db.find()
    .sort({ user_id: -1 })
    .limit(1)
    .toArray();

    let newUserId = 1001; // ค่าเริ่มต้น

    if (lastUser.length > 0) { 
       newUserId = lastUser[0].user_id + 1;}
    
    const hashedPassword = await bcrypt.hash(req.body.login_password, 10); // เข้ารหัสรหัสผ่าน
      
    const user ={
        user_id:newUserId,
        login_name:req.body.login_name,
        login_password:hashedPassword,
        user_role: "customer",
        fullname:req.body.fullname,
        phone:req.body.phone
    };
    //บันทึกข้อมูลลง MongoDB
    const result = await db.insertOne(user);

      // ส่งข้อมูลกลับเป็น JSON
    res.json({
        message:"register sucess",
        data: result
    });
      } catch (error) {
    res.status(500).json({ message: "server error" });
      }

});
app.post("/users/login", async (req, res) => {

  const db = mongoose.connection.collection("users");

  try {

    // เช็คว่ากรอกข้อมูลครบไหม
    if (!req.body.login_name || !req.body.login_password) {
      return res.status(400).json({ message: "please fill login_name and password" });
    }

    // หา user ใน database
    const user = await db.findOne({ login_name: req.body.login_name });

    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    // ตรวจ password
    const isMatch = await bcrypt.compare(
      req.body.login_password,
      user.login_password
    );

    if (!isMatch) {
      return res.status(400).json({ message: "wrong password" });
    }

    // login สำเร็จ
    res.json({
      message: "login success",
      user: {
        user_id: user.user_id,
        login_name: user.login_name,
        user_role: user.user_role,
        fullname: user.fullname
      }
    });

  } catch (error) {
    res.status(500).json({ message: "server error" });
  }

});
// เปิด Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

