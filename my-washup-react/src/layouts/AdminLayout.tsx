import { Outlet, Link, useLocation } from "react-router-dom";
import "../pages/admin/OwnerDashboard.css"; // ดึงสไตล์ของ Owner มาใช้

export default function AdminLayout() {
  const location = useLocation(); // เอาไว้เช็คว่าตอนนี้อยู่หน้าไหน จะได้ขีดเส้นใต้เมนูถูกอัน

  return (
    <div className="owner-bg">
      {/* 🟢 แถบเมนูด้านบน (Navbar) แบบในรูป */}
      <nav className="owner-navbar">
        {/* 🚀 เอาโลโก้รูปภาพมาใส่แทนตัวหนังสือตรงนี้เลย */}
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

          <span className="owner-badge">OWNER</span>
          <span className="logout-btn">LOGOUT</span>
        </div>
      </nav>

      {/* 🟢 พื้นที่สำหรับให้หน้า Dashboard หรือหน้าอื่นๆ มาเสียบโชว์ตรงนี้ */}
      <Outlet />
    </div>
  );
}
