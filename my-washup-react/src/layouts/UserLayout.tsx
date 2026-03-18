import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function UserLayout() {
  return (
    // จัด Layout ให้ Footer อยู่ล่างสุดเสมอ แม้เนื้อหาตรงกลางจะน้อย
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* 🟢 ส่วนหัว: เมนูนำทาง (คงที่ทุกหน้า) */}
      <Navbar />

      {/* 🟡 ส่วนเนื้อหาตรงกลาง: จะเปลี่ยนไปตาม URL ที่ลูกค้าเข้า */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* 🔴 ส่วนท้าย: ข้อมูลติดต่อ (คงที่ทุกหน้า) */}
      <Footer />
    </div>
  );
}
