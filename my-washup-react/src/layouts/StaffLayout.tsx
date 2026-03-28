import { Outlet, Link, useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";

export default function StaffLayout() {
  const navigate = useNavigate();

  // 1️⃣ ดึงข้อมูล User จาก localStorage
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // 2️⃣ ฟังก์ชัน Logout เพื่อล้างค่า
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <style>{`
        .staff-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 10%;
          background-color: #ffffff;
          border-bottom: 2px solid #f0f0f0;
        }
        .staff-nav-links { display: flex; align-items: center; gap: 30px; }
        .nav-link-staff { text-decoration: none; color: #333; font-weight: 600; border-bottom: 2px solid #e60000; padding-bottom: 5px; }
        .staff-badge { 
          background-color: #e60000; 
          color: white; 
          padding: 8px 20px; 
          border-radius: 8px; 
          font-weight: bold;
          text-transform: uppercase;
        }
      `}</style>

      <nav className="staff-nav">
        <div className="nav-logo">
          <Link to="/staff">
            <img src="/image/logowashup.png" alt="Logo" height="50" />
          </Link>
        </div>
        <div className="staff-nav-links">
          <Link to="/staff" className="nav-link-staff">
            ตารางคิวงาน
          </Link>
          <div className="staff-auth">
            {/* 3️⃣ เปลี่ยนจาก USERNAME เป็นชื่อจริงของคนล๊อกอิน */}
            <span className="staff-badge">
              {user ? user.fullname : "พนักงาน"}
            </span>
            <button
              onClick={handleLogout}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                marginLeft: "15px",
                color: "#999",
                fontFamily: "Kanit",
              }}
            >
              LOGOUT
            </button>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
