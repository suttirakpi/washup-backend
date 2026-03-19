import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import Home from "./pages/user/Home";
import Login from "./pages/auth/Login"; // Import มาก่อน
import Register from "./pages/auth/Register"; // 1. Import มา
import OwnerDashboard from "./pages/admin/OwnerDashboard";
// 1. นำเข้า StaffLayout ที่เพิ่งสร้าง
import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/Dashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 โซนลูกค้า */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
        </Route>

        {/* 🔵 โซนพนักงาน */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboard />} />
        </Route>

        {/* 🔴 โซนเจ้าของ (Owner): เพิ่มตรงนี้ครับคุณตูน */}
        <Route path="/admin" element={<OwnerDashboard />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
