const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

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

app.use("/api/auth", authMiddleware);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/vehicle-types", vehicleTypeRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});