import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 1️⃣ เติม React.FormEvent ตรงนี้ครับ TypeScript จะได้เลิกบ่น
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 2️⃣ URL ยิงไปหา Backend ของเพื่อน
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 3️⃣ ส่งตัวแปรชื่อ login_name และ login_password ตามที่ Backend รอรับ
        body: JSON.stringify({
          login_name: username,
          login_password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // ล็อกอินสำเร็จ เก็บ Token ไว้ใช้งาน
        localStorage.setItem("token", data.token);

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("userName", data.user.fullname);
        // เช็คสิทธิ์ด้วยคำว่า user_role
        if (data.user.user_role === "admin") {
          navigate("/admin"); // ถ้าเป็นเจ้าของ เด้งไปหน้ากราฟรายได้
        } else if (data.user.user_role === "staff") {
          navigate("/staff"); // ถ้าเป็นพนักงาน เด้งไปหน้าจดสภาพรถ
        } else {
          navigate("/"); // ถ้าเป็นลูกค้าทั่วไป เด้งไปหน้าแรก
        }
      } else {
        alert("เข้าสู่ระบบไม่สำเร็จ: " + data.message);
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ลองใหม่อีกครั้งครับ");
    }
  };

  return (
    <>
      <style>{`
        .login-page-bg {
          background-color: #f8f9fa;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Kanit', sans-serif;
          padding: 20px;
        }

        .login-card {
          background: white;
          padding: 50px 40px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 450px;
          text-align: center;
        }

        .login-logo {
          height: 60px;
          margin-bottom: 30px;
        }

        .login-title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 35px;
        }

        .input-group-clean {
          margin-bottom: 20px;
          text-align: left;
        }

        .input-group-clean label {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .input-clean {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          color: #333;
          background-color: #fbfbfb;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .input-clean:focus {
          border-color: #e60000;
          box-shadow: 0 0 0 3px rgba(230, 0, 0, 0.1);
          outline: none;
        }

        .btn-login-red {
          width: 100%;
          padding: 14px;
          background-color: #e60000;
          color: white;
          border: none;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 25px;
          margin-bottom: 25px;
          font-family: 'Kanit', sans-serif;
        }

        .btn-login-red:hover {
          background-color: #cc0000;
        }

        .register-text {
          font-size: 14px;
          color: #777;
        }

        .register-link {
          color: #e60000;
          text-decoration: none;
          font-weight: 600;
          margin-left: 5px;
        }

        .register-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="login-page-bg">
        <div className="login-card">
          <img
            src="/image/logowashup.png"
            alt="WASH UP Logo"
            className="login-logo"
          />

          <h2 className="login-title">เข้าสู่ระบบ WASH UP</h2>

          <form onSubmit={handleLogin} autoComplete="off">
            {/* 🛑 ส่วนที่เพิ่ม: ช่องหลอกสำหรับ Login */}
            <input type="text" name="fake_user" style={{ display: "none" }} />
            <input
              type="password"
              name="fake_pass"
              style={{ display: "none" }}
            />

            <div className="input-group-clean">
              <label>ชื่อผู้ใช้งาน / Username</label>
              <input
                type="text"
                className="input-clean"
                placeholder="กรุณากรอกชื่อผู้ใช้งาน"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="one-time-code" // ✅ เทคนิคหลอก Browser ไม่ให้จำค่า
                required
              />
            </div>

            <div className="input-group-clean">
              <label>รหัสผ่าน / Password</label>
              <input
                type="password"
                className="input-clean"
                placeholder="กรุณากรอกรหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="one-time-code"
                required
              />
            </div>

            <button type="submit" className="btn-login-red">
              LOGIN
            </button>
          </form>

          <div className="register-text">
            หากยังไม่มีบัญชี?
            <Link to="/register" className="register-link">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
