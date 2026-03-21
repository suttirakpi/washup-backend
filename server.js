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

// React router fallback
//app.use((req, res) => {
//  res.sendFile(path.join(__dirname, "dist", "index.html"));//
//});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});