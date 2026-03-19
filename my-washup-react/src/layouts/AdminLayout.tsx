import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"; // 👈 เพิ่ม useNavigate
import { useState, useEffect } from "react"; // 👈 เพิ่ม useState, useEffect
import "../pages/admin/OwnerDashboard.css";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate(); // 👈 ตัวช่วยเด้งเปลี่ยนหน้า
  const [userName, setUserName] = useState("OWNER"); // 👈 State เก็บชื่อ

  // 🟢 ดึงชื่อจากกระเป๋า (localStorage) ทันทีที่เปิดหน้านี้
  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName); // เอาชื่อมาตั้งค่า
    }
  }, []);

  // 🔴 ฟังก์ชันกดปุ่ม Logout
  const handleLogout = () => {
    if (window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      localStorage.clear(); // ล้างข้อมูลทั้งหมดในกระเป๋า (ลบ Token และ ชื่อ)
      navigate("/login"); // เด้งกลับไปหน้า Login
    }
  };

  return (
    <div className="owner-bg">
      {/* 🟢 แถบเมนูด้านบน (Navbar) */}
      <nav className="owner-navbar">
        <Link to="/admin">
          <img src="/image/logowashup.png" alt="Logo" height="50" />
        </Link>

        <div className="nav-links">
          {/* ลิงก์ 1: ภาพรวมรายได้ */}
          <Link
            to="/admin"
            className={location.pathname === "/admin" ? "active" : ""}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            ภาพรวมรายได้
          </Link>

          {/* ลิงก์ 2: จัดการแพ็คเกจ */}
          <Link
            to="/admin/packages"
            className={
              location.pathname.includes("/admin/packages") ? "active" : ""
            }
            style={{ textDecoration: "none", color: "inherit" }}
          >
            จัดการแพ็คเกจ
          </Link>

          {/* 🚀 เอาตัวแปรชื่อมาแสดงตรงนี้ */}
          <span className="owner-badge">{userName}</span>

          {/* 🚀 เรียกใช้ฟังก์ชัน handleLogout เมื่อกด */}
          <span
            className="logout-btn"
            onClick={handleLogout}
            style={{ cursor: "pointer", fontWeight: "bold" }}
          >
            LOGOUT
          </span>
        </div>
      </nav>

      {/* 🟢 พื้นที่สำหรับให้หน้าอื่นๆ มาเสียบ */}
      <Outlet />
    </div>
  );
}
