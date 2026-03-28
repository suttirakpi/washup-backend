import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [formData, setFormData] = useState({
    login_name: "",
    login_password: "",
    fullname: "",
    phone: "",
  });

  // 1️⃣ เพิ่ม State สำหรับเก็บค่ายืนยันรหัสผ่าน
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 2️⃣ ตรวจสอบว่ารหัสผ่านตรงกันไหมก่อนส่ง API
    if (formData.login_password !== confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน กรุณากรอกใหม่อีกครั้ง");
      return; // หยุดการทำงาน ไม่ส่ง API
    }

    try {
      const response = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("สมัครสมาชิกสำเร็จ!");
        navigate("/login");
      } else {
        alert(data.message); // แสดง Error จาก Backend (เช่น Username ซ้ำ)
      }
    } catch (error) {
      console.error("Register Error:", error);
    }
  };

  return (
    <>
      <style>{`
        /* CSS เดิม เป๊ะตามดีไซน์ */
        .auth-page-bg { background-color: #f8f9fa; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Kanit', sans-serif; padding: 40px 20px; }
        .auth-card { background: white; padding: 50px 40px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; max-width: 500px; text-align: center; }
        .auth-logo { height: 60px; margin-bottom: 30px; }
        .auth-title { font-size: 24px; font-weight: 600; color: #333; margin-bottom: 35px; }
        .input-group-clean { margin-bottom: 15px; text-align: left; }
        .input-group-clean label { display: block; font-size: 14px; color: #666; margin-bottom: 8px; font-weight: 500; }
        .input-clean { width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; color: #333; background-color: #fbfbfb; box-sizing: border-box; }
        .input-clean:focus { border-color: #e60000; outline: none; }
        .password-hint { font-size: 11px; color: #999; margin-top: 5px; line-height: 1.4; }
        .btn-register-red { width: 100%; padding: 14px; background-color: #e60000; color: white; border: none; border-radius: 30px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 35px; margin-bottom: 25px; }
        .btn-register-red:hover { background-color: #cc0000; }
        .login-link-text { font-size: 14px; color: #777; }
        .login-link { color: #e60000; text-decoration: none; font-weight: 600; margin-left: 5px; }
      `}</style>

      <div className="auth-page-bg">
        <div className="auth-card">
          <img
            src="/image/logowashup.png"
            alt="WASH UP Logo"
            className="auth-logo"
          />
          <h2 className="auth-title">สมัครสมาชิกใหม่</h2>

          <form onSubmit={handleRegister}>
            {/* ... ช่อง Fullname, Phone, Username เหมือนเดิม ... */}
            <div className="input-group-clean">
              <label>ชื่อ-นามสกุล / Full Name</label>
              <input
                type="text"
                name="fullname"
                className="input-clean"
                placeholder="สมชาย รักสะอาด"
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group-clean">
              <label>เบอร์โทรศัพท์ / Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="input-clean"
                placeholder="0812345678"
                onChange={handleChange}
                required
              />
            </div>
            <div className="input-group-clean">
              <label>ชื่อผู้ใช้งาน / Username</label>
              <input
                type="text"
                name="login_name"
                className="input-clean"
                placeholder="ภาษาอังกฤษหรือตัวเลข"
                onChange={handleChange}
                required
              />
            </div>

            {/* ช่องรหัสผ่าน */}
            <div className="input-group-clean">
              <label>รหัสผ่าน / Password</label>
              <input
                type="password"
                name="login_password"
                className="input-clean"
                placeholder="********"
                onChange={handleChange}
                required
              />
              <p className="password-hint">
                * ต้องมีอย่างน้อย 8 ตัวอักษร, พิมพ์ใหญ่ 1 ตัว และอักขระพิเศษ 1
                ตัว (!@#$%)
              </p>
            </div>

            {/* 3️⃣ เพิ่มช่องยืนยันรหัสผ่าน (UI เหมือนช่องรหัสผ่าน) */}
            <div className="input-group-clean">
              <label>ยืนยันรหัสผ่าน / Confirm Password</label>
              <input
                type="password"
                className="input-clean"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-register-red">
              ยืนยันการสมัคร
            </button>
          </form>

          <div className="login-link-text">
            มีบัญชีอยู่แล้ว?
            <Link to="/login" className="login-link">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
