import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <>
      {/* 🎨 ฝัง CSS ไว้ใน Component โดยตรง */}
      <style>{`
        .footer-container {
          background-color: #1a1a1a;
          color: #ffffff;
          padding: 60px 10%;
          font-family: "Kanit", sans-serif;
          margin-top: auto;
        }
        .footer-grid {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          max-width: 1200px;
          margin: 0 auto;
          gap: 30px;
        }
        .footer-col-1 {
          flex: 1.5;
          min-width: 250px;
        }
        .footer-logo {
          height: 45px;
          margin-bottom: 25px;
        }
        .footer-col-1 p {
          color: #cccccc;
          font-size: 14px;
          font-weight: 300;
        }
        .footer-col-2 {
          flex: 1;
          min-width: 200px;
        }
        .footer-col-2 h4 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 25px;
        }
        .footer-col-2 ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer-col-2 ul li {
          margin-bottom: 15px;
        }
        .footer-col-2 ul li a {
          color: #cccccc;
          text-decoration: none;
          font-size: 14px;
          font-weight: 300;
          transition: color 0.3s;
        }
        .footer-col-2 ul li a:hover {
          color: #d71920;
        }
        .footer-col-3 {
          flex: 1;
          min-width: 200px;
        }
        .footer-col-3 h4 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 25px;
        }
        .footer-socials {
          display: flex;
          gap: 15px;
        }
        .footer-socials a {
          color: #ffffff;
          font-size: 26px;
          transition: transform 0.3s, color 0.3s;
        }
        .footer-socials a:hover {
          color: #d71920;
          transform: translateY(-3px);
        }
        @media (max-width: 768px) {
          .footer-grid {
            flex-direction: column;
            text-align: left;
          }
        }
      `}</style>

      {/* 🏗️ โครงสร้าง HTML (JSX) */}
      <footer className="footer-container">
        <div className="footer-grid">
          <div className="footer-col-1">
            <img
              src="/image/logowashup.png"
              alt="WASH UP Logo"
              className="footer-logo"
            />
            <p>ระบบจองคิวล้างรถ</p>
          </div>

          <div className="footer-col-2">
            <h4>ระบบจองคิวล้างรถ</h4>
            <ul>
              <li>
                <Link to="/">หน้าแรก</Link>
              </li>
              <li>
                <Link to="/booking">จองบริการล้างรถ</Link>
              </li>
              <li>
                <Link to="/login">เข้าสู่ระบบ</Link>
              </li>
              <li>
                <Link to="/register">สมัครสมาชิก</Link>
              </li>
              <li>
                <Link to="/history">ประวัติ</Link>
              </li>
            </ul>
          </div>

          <div className="footer-col-3">
            <h4>ติดต่อเรา</h4>
            <div className="footer-socials">
              <a href="#">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#">
                <i className="fab fa-tiktok"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
