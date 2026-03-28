import React, { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import "./OwnerDashboard.css";

export default function OwnerDashboard() {
  // 1. State รอรับข้อมูล
  const [stats, setStats] = useState({
    dailyRevenue: 0,
    completedWashes: 0,
    cancelled: 0,
    popularPackage: "-",
  });
  const [chartData, setChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // 2. ฟังก์ชันดึงข้อมูลจาก Backend
  const fetchOwnerData = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "http://localhost:3000/api/dashboard/owner",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // 🎯 แมปปิ้งข้อมูลให้ตรงกับที่เพื่อนส่งมา (แก้ปัญหาชื่อไม่ตรง)
        setStats({
          dailyRevenue: data.stats.dailyRevenue || 0,
          completedWashes: data.stats.completed || 0, // หลังบ้านชื่อ completed
          cancelled: data.stats.cancelled || 0,
          popularPackage: data.stats.popularPackage || "-",
        });

        setChartData(data.chart || []); // หลังบ้านส่งมาชื่อ chart
        setRecentTransactions(data.recentTransactions || []);
      }
    } catch (err) {
      console.error("ดึงข้อมูล Dashboard ไม่สำเร็จ:", err);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  return (
    <div className="owner-bg">
      <div className="owner-content">
        {/* ----- 4 Cards สรุปยอด ----- */}
        <div className="stats-grid">
          <div className="stat-card red-border">
            <div className="stat-title">Daily Revenue</div>
            <div className="stat-value">
              {stats.dailyRevenue.toLocaleString()}{" "}
              <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                THB
              </span>
            </div>
          </div>
          <div className="stat-card dark-border">
            <div className="stat-title">Completed Washes</div>
            <div className="stat-value">
              {stats.completedWashes}{" "}
              <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                Cars
              </span>
            </div>
          </div>
          <div className="stat-card gray-border">
            <div className="stat-title">Cancelled</div>
            <div className="stat-value">
              {stats.cancelled}{" "}
              <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                Bookings
              </span>
            </div>
          </div>
          <div className="stat-card yellow-border">
            <div className="stat-title">Popular Package</div>
            <div
              className="stat-value"
              style={{ fontSize: "18px", paddingTop: "5px" }}
            >
              {stats.popularPackage}
            </div>
          </div>
        </div>

        {/* ----- กราฟ ----- */}
        <div className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">7-Day Revenue Trends</h2>
              <p className="section-subtitle">
                Performance visualization for the current week
              </p>
            </div>
          </div>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d71920" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#d71920" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eee"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#888" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#888" }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d71920"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ----- ตารางข้อมูลล่าสุด ----- */}
        <div className="table-section">
          <div className="section-header">
            <h2 className="section-title">Recent Transactions</h2>
            <span className="live-badge">LIVE UPDATED</span>
          </div>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Datetime</th>
                <th>Booking ID</th>
                <th>License Plate</th>
                <th>Package</th>
                <th>Amount</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx, index) => (
                <tr key={index}>
                  {/* 🎯 เปลี่ยนชื่อตัวแปรให้ตรงกับ backend */}
                  <td>{tx.datetime}</td>
                  <td className="text-red">{tx.booking_id}</td>
                  <td className="fw-bold">{tx.vehicle}</td>
                  <td>{tx.service}</td>
                  <td className="fw-bold">{tx.total}</td>
                  <td>{tx.customer}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="view-all">View All Transactions</div>
        </div>
      </div>
    </div>
  );
}
