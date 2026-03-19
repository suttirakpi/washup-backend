import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
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
  // 1. สร้าง State มารอรับข้อมูลจาก Backend
  const [stats, setStats] = useState({
    dailyRevenue: 0,
    completedWashes: 0,
    cancelled: 0,
    popularPackage: "-",
  });
  const [chartData, setChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // 2. ฟังก์ชันไปดึงข้อมูลจากเพื่อน (Backend)
  const fetchOwnerData = async () => {
    const token = localStorage.getItem("token"); // ดึง Token ถ้ามีระบบ Login

    try {
      const response = await fetch(
        "http://localhost:3000/api/dashboard/owner",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // เอาข้อมูลที่เพื่อนส่งมา ยัดใส่ State ของเรา
        setStats(data.stats);
        setChartData(data.chartData);
        setRecentTransactions(data.recentTransactions);
      }
    } catch (err) {
      console.error("ดึงข้อมูล Dashboard ไม่สำเร็จ:", err);
    }
  };

  // 3. สั่งให้ดึงข้อมูลทันทีที่เปิดหน้านี้
  useEffect(() => {
    fetchOwnerData();
  }, []);

  return (
    <div className="owner-bg">
      {/* Navbar */}
      <nav className="owner-navbar">
        <div
          style={{ fontSize: "24px", fontWeight: "900", fontStyle: "italic" }}
        >
          <span style={{ color: "#33b5e5" }}>WASH</span>{" "}
          <span style={{ color: "#d71920" }}>UP</span>
        </div>
        <div className="nav-links">
          <span>จัดการแพ็คเกจ</span>
          <span>จัดการประเภทรอยยนต์</span>
          <span className="active">ภาพรวมรายได้</span>
          <span className="owner-badge">OWNER</span>
          <span className="logout-btn">LOGOUT</span>
        </div>
      </nav>

      {/* Content */}
      <div className="owner-content">
        {/* 4 Cards ด้านบน (เปลี่ยนมาใช้ตัวแปรจาก Backend แล้ว) */}
        <div className="stats-grid">
          <div className="stat-card red-border">
            <div className="stat-title">Daily Revenue</div>
            <div className="stat-value">
              {stats.dailyRevenue.toLocaleString()}{" "}
              <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                THB
              </span>
            </div>
            <div className="stat-sub text-green">↑ 12% from yesterday</div>
          </div>
          <div className="stat-card dark-border">
            <div className="stat-title">Completed Washes</div>
            <div className="stat-value">
              {stats.completedWashes}{" "}
              <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                Cars
              </span>
            </div>
            <div className="stat-sub">Target: 20 per day</div>
          </div>
          <div className="stat-card gray-border">
            <div className="stat-title">Cancelled</div>
            <div className="stat-value">
              {stats.cancelled}{" "}
              <span style={{ fontSize: "12px", fontWeight: "normal" }}>
                Bookings
              </span>
            </div>
            <div className="stat-sub text-red">Rate: 1.2%</div>
          </div>
          <div className="stat-card yellow-border">
            <div className="stat-title">Popular Package</div>
            <div
              className="stat-value"
              style={{ fontSize: "18px", paddingTop: "5px" }}
            >
              {stats.popularPackage}
            </div>
            <div className="stat-sub text-yellow" style={{ marginTop: "5px" }}>
              BEST SELLER THIS WEEK
            </div>
          </div>
        </div>

        {/* กราฟ */}
        <div className="chart-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">7-Day Revenue Trends</h2>
              <p className="section-subtitle">
                Performance visualization for the current week
              </p>
            </div>
            <div className="chart-actions">
              <button>Export CSV</button>
              <button>Print Report</button>
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

        {/* ตารางข้อมูลล่าสุด */}
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
                <th>Staff</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx, index) => (
                <tr key={index}>
                  <td>{tx.datetime}</td>
                  <td className="text-red">{tx.id}</td>
                  <td className="fw-bold">{tx.plate}</td>
                  <td>{tx.package}</td>
                  <td className="fw-bold">{tx.amount}</td>
                  <td>{tx.staff}</td>
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
