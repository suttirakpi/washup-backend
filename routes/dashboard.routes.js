const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");

router.get("/owner", authMiddleware, async (req, res) => {

  // 🔐 เช็ค role
  if (req.user.user_role !== "admin") {
    return res.status(403).json({ message: "forbidden" });
  }

  const bookings = mongoose.connection.collection("bookings");
  const payments = mongoose.connection.collection("payments");
  const bookingServices = mongoose.connection.collection("booking_services");
  const services = mongoose.connection.collection("service");
  const vehicles = mongoose.connection.collection("vehicles");
  const users = mongoose.connection.collection("users");
  const vehicleTypes = mongoose.connection.collection("vehicle_type");

  try {

    const today = new Date();
    today.setHours(0,0,0,0);

    // ===============================
    // ✅ 1. STATS
    // ===============================

    const dailyRevenueAgg = await payments.aggregate([
      {
        $match: {
          payment_status: "paid",
          paid_at: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" }
        }
      }
    ]).toArray();

    const dailyRevenue = dailyRevenueAgg[0]?.total || 0;

    const totalRevenueAgg = await payments.aggregate([
      { $match: { payment_status: "paid" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" }
        }
      }
    ]).toArray();

    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const todayBookings = await bookings.countDocuments({
      booking_datetime: { $gte: today }
    });

    const completed = await bookings.countDocuments({ status: "completed" });
    const pending = await bookings.countDocuments({ status: "pending" });
    const cancelled = await bookings.countDocuments({ status: "cancelled" });

    const popularAgg = await bookingServices.aggregate([
      { $group: { _id: "$service_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      {
        $lookup: {
          from: "service",
          localField: "_id",
          foreignField: "service_id",
          as: "service"
        }
      },
      { $unwind: "$service" }
    ]).toArray();

    const popularPackage = popularAgg[0]?.service.service_name || "-";


    // ===============================
    // ✅ 2. CHART (7 DAYS)
    // ===============================
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      last7Days.push({
        date: d.toISOString().split("T")[0],
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: 0
      });
    }

    const chartAgg = await payments.aggregate([
      { $match: { payment_status: "paid" } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paid_at" }
          },
          revenue: { $sum: "$total_amount" }
        }
      }
    ]).toArray();

    chartAgg.forEach(item => {
      const found = last7Days.find(d => d.date === item._id);
      if (found) found.revenue = item.revenue;
    });

    const chartData = last7Days.map(d => ({
      name: d.name,
      revenue: d.revenue
    }));


    // ===============================
    // ✅ 3. RECENT TRANSACTIONS (สำคัญ!)
    // ===============================
    const recentBookings = await bookings.find({
      payment_status: "paid"
    })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();

    const recentTransactions = await Promise.all(
      recentBookings.map(async (b) => {

        const user = await users.findOne({ user_id: b.user_id });
        const vehicle = await vehicles.findOne({ vehicle_id: b.vehicle_id });

        const serviceData = await bookingServices.aggregate([
          { $match: { booking_id: b.booking_id } },
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

        const serviceName = serviceData.map(s => s.service.service_name).join(", ");

        let size = "";
        if (vehicle?.vehicle_type_id) {
          const vt = await vehicleTypes.findOne({
            vehicle_type_id: vehicle.vehicle_type_id
          });
          size = vt?.type_name || "";
        }

        const dt = new Date(b.created_at);

        const datetime =
          dt.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }) +
          ", " +
          dt.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
          });

        return {
          booking_id: b.booking_id,
          customer: user?.login_name || "-",
          service: serviceName,
          vehicle: vehicle?.license_plate || "-",
          size,
          total: b.total_price,
          datetime
        };
      })
    );


    // ===============================
    // ✅ FINAL RESPONSE (ตรง UI 100%)
    // ===============================
    res.json({
      stats: {
        dailyRevenue,
        totalRevenue,
        todayBookings,
        completed,
        pending,
        cancelled,
        popularPackage
      },
      chart: chartData,
      recentTransactions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "dashboard error" });
  }
});

module.exports = router;