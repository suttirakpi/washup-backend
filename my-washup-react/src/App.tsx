import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import UserLayout from "./layouts/UserLayout";
import Home from "./pages/user/Home";
import Login from "./pages/auth/Login"; // Import มาก่อน
import Register from "./pages/auth/Register"; // 1. Import มา
import OwnerDashboard from "./pages/admin/OwnerDashboard";
// 1. นำเข้า StaffLayout ที่เพิ่งสร้าง
import StaffLayout from "./layouts/StaffLayout";
import StaffDashboard from "./pages/staff/Dashboard";
import AdminLayout from "./layouts/AdminLayout";

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

        {/* 🔴 โซนเจ้าของ (Owner) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<OwnerDashboard />} />
          {/* อนาคตถ้าสร้างหน้าจัดการแพ็คเกจเสร็จ ก็เอามาเสียบต่อตรงนี้ได้เลย เช่น: */}
          {/* <Route path="packages" element={<ManagePackages />} /> */}
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}
