import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface User {
  login_name: string;
}

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  const isActive = (path: string) =>
    location.pathname === path ? "active" : "";

  return (
    <>
      {/* 🎨 ฝัง CSS ไว้ใน Component โดยตรง */}
      <style>{`
        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 10%;
          background-color: #ffffff;
          border-bottom: 2px solid #f0f0f0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          position: sticky;
          top: 0;
          z-index: 1000;
          width: 100%;
        }
        .nav-logo {
          margin-right: auto;
        }
        .nav-links {
          display: flex;
          gap: 40px;
          margin-right: 40px;
        }
        .nav-item {
          text-decoration: none;
          color: #555;
          font-weight: 300;
          font-size: 16px;
          padding-bottom: 5px;
          transition: all 0.3s;
        }
        .nav-item:hover {
          color: #d71920;
        }
        .nav-item.active {
          color: #000;
          font-weight: 600;
          border-bottom: 3px solid #e60000;
        }
        .nav-auth {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .auth-link-red {
          text-decoration: none;
          color: #e60000;
          font-weight: 600;
          font-size: 16px;
          text-transform: uppercase;
        }
        .btn-user-badge {
          background-color: #e60000;
          color: #ffffff;
          padding: 8px 18px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        .btn-logout {
          color: #999;
          text-decoration: underline;
          cursor: pointer;
          font-weight: 500;
          font-size: 14px;
          border: none;
          background: none;
          text-transform: uppercase;
        }
        .btn-logout:hover {
          color: #666;
        }
      `}</style>

      {/* 🏗️ โครงสร้าง HTML (JSX) */}
      <nav className="navbar-container">
        <div className="nav-logo">
          <Link to="/">
            <img src="/image/logowashup.png" alt="WASH UP Logo" height="50" />
          </Link>
        </div>

        <div className="nav-links">
          <Link to="/" className={`nav-item ${isActive("/")}`}>
            หน้าแรก
          </Link>
          <Link to="/booking" className={`nav-item ${isActive("/booking")}`}>
            จองบริการ
          </Link>
          <Link to="/history" className={`nav-item ${isActive("/history")}`}>
            ประวัติ
          </Link>
        </div>

        <div className="nav-auth">
          {user ? (
            <>
              <Link to="/profile" className="btn-user-badge">
                {user.login_name}
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-link-red">
                LOGIN
              </Link>
              <Link to="/register" className="auth-link-red">
                REGISTER
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
};
