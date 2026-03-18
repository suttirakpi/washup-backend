import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// 1. นำเข้า Layouts (ขนมปังแฮมเบอร์เกอร์)
import UserLayout from "./layouts/UserLayout";

// 2. นำเข้า Pages (ไส้แฮมเบอร์เกอร์)
import Home from "./pages/user/Home";
// import Booking from './pages/user/Booking'; (เดี๋ยวค่อยสร้าง)

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 โซนลูกค้า (User Zone) */}
        <Route path="/" element={<UserLayout />}>
          {/* แวะเข้าหน้าแรก (Home) เป็นค่าเริ่มต้น */}
          <Route index element={<Home />} />

          {/* ถ้าพิมพ์ /booking ค่อยดึงหน้า Booking มาเสียบตรงกลาง */}
          {/* <Route path="booking" element={<Booking />} /> */}
        </Route>

        {/* 🔵 โซนพนักงาน (เดี๋ยวเราค่อยมาเพิ่ม StaffLayout ตรงนี้) */}
        {/* <Route path="/staff" element={<StaffLayout />}> ... </Route> */}
      </Routes>
    </Router>
  );
}
