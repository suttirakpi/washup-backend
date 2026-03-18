import { Link } from "react-router-dom";
import "../../style.css"; // 🎯 ดึง CSS ต้นฉบับของคุณตูนมาใช้!

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-left">
          <h1>
            สัมผัสความเงางาม
            <br />
            ระดับพรีเมียม
            <br />
            โดยไม่ต้องเสียเวลารอคิว
          </h1>
          <p>
            WASH UP ระบบจองคิวล้างรถ เลือกรถ เลือกบริการ และระบุเวลาที่คุณสะดวก
            พร้อมติดตามสถานะแบบ REAL-TIME เพื่อประสบการณ์ที่ดีที่สุดของคุณ
          </p>
          <button className="btn-booking-hero">จองคิวล้างรถทันที</button>
        </div>
        <div className="hero-right"></div>
      </section>

      <section className="why-section">
        <h2 className="section-title">ทำไมต้องใช้ WASH-UP?</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="icon-circle">
              <i className="fas fa-car"></i>
            </div>
            <h3>รองรับรถได้ทุกประเภท</h3>
            <p>
              เพิ่มและจัดการข้อมูลรถของคุณได้หลายคัน
              ระบบคำนวณราคาให้ตรงตามไซส์รถเป๊ะๆ
            </p>
          </div>
          <div className="why-card">
            <div className="icon-circle">
              <i className="fas fa-broom"></i>
            </div>
            <h3>เลือกบริการได้ดั่งใจ</h3>
            <p>
              ไม่ว่าจะล้างสี ดูดฝุ่น หรือเคลือบแก้ว
              ก็สามารถกดเลือกมิกซ์แอนด์แมทช์ได้ในบิลเดียว
            </p>
          </div>
          <div className="why-card">
            <div className="icon-circle">
              <i className="fas fa-mobile-alt"></i>
            </div>
            <h3>รู้สถานะแบบ REAL-TIME</h3>
            <p>ติดตามความคืบหน้าของรถคุณได้ตลอดเวลาตั้งแต่เริ่มล้างจนจบงาน</p>
          </div>
        </div>
      </section>

      <section className="about-red">
        <h2>รู้จักกับ WASH UP</h2>
        <p>
          ที่ WASH UP
          เราเชื่อว่ารถที่เงางามคือภาพสะท้อนของความภาคภูมิใจและรายละเอียดที่ใส่ใจ
          เราจึงมุ่งมั่นมอบบริการดูแลรถยนต์ที่เหนือกว่าการล้างทำความสะอาดทั่วไป
          ด้วยทีมงานมืออาชีพและระบบจัดการคิวที่ทันสมัย
          เพื่อให้รถทุกคันที่ผ่านการดูแลจากเราเปล่งประกายในแบบที่ควรจะเป็น
        </p>
      </section>

      <section className="highlight-wrap">
        <div className="highlight-text">
          <h2>ไฮไลท์บริการ</h2>
          <p>
            บริการล้างสีและดูแลสภาพภายนอกของเรา
            ขจัดคราบฝุ่นและสิ่งสกปรกฝังลึกได้อย่างหมดจด
            ด้วยน้ำยาทำความสะอาดสูตรถนอมสีรถและเทคโนโลยีการฉีดล้างที่ได้มาตรฐาน
            เราเน้นปกป้องพื้นผิวพร้อมมอบความเงางามที่โดดเด่นในทุกมุมมอง
            ไม่ว่าจะเป็นการล้างทำความสะอาดทั่วไป หรือเตรียมผิวรถก่อนการเคลือบเงา
          </p>
        </div>
        <div className="highlight-img">
          <img
            src="https://img.freepik.com/premium-photo/worker-washing-red-car-with-sponge-car-wash_179755-10324.jpg"
            alt="Washing car"
          />
        </div>
      </section>

      <section className="steps-bg">
        <h2>วิธีการใช้บริการ</h2>
        <p className="sub">4 ขั้นตอนง่ายๆ ในการจองคิว</p>
        <div className="steps-grid">
          <div className="step-box">
            <div className="step-icon">
              <i className="fas fa-car"></i>
              <div className="step-num">1</div>
            </div>
            <h4>เลือกรถของคุณ</h4>
          </div>
          <div className="step-box">
            <div className="step-icon">
              <i className="fas fa-list-check"></i>
              <div className="step-num">2</div>
            </div>
            <h4>เลือกบริการ</h4>
          </div>
          <div className="step-box">
            <div className="step-icon">
              <i className="fas fa-clock"></i>
              <div className="step-num">3</div>
            </div>
            <h4>ระบุเวลาที่สะดวก</h4>
          </div>
          <div className="step-box">
            <div className="step-icon">
              <i className="fas fa-car-side"></i>
              <div className="step-num">4</div>
            </div>
            <h4>รับรถ</h4>
          </div>
        </div>
        <button className="btn-main-booking">จองคิวล้างรถ</button>
      </section>

      <section className="package-section">
        <h2 className="section-title">แพ็กเกจบริการยอดนิยม</h2>
        <div className="package-grid">
          <div className="package-card">
            <h3>ล้างอัดฉีด - ฉีดล้างช่วงล่าง</h3>
            <p
              style={{ fontSize: "12px", color: "#888", marginBottom: "15px" }}
            >
              ดูแลความสะอาดล้างอัดฉีด รวมไปถึงใต้ท้องรถ และ ซุ้มล้อ
            </p>
            <div className="price">250.-</div>
            <ul>
              <li>
                <i className="fas fa-check"></i> ฉีดล้างโคลนใต้ท้องรถ
              </li>
              <li>
                <i className="fas fa-check"></i> ฉีดล้างซุ้มล้อ
              </li>
            </ul>
            <button className="btn-select">ขอจองบริการนี้</button>
          </div>

          <div className="package-card popular">
            <div className="popular-badge">ยอดนิยม</div>
            <h3>ล้างสี - ดูดฝุ่น</h3>
            <p
              style={{ fontSize: "12px", color: "#888", marginBottom: "15px" }}
            >
              ดูแลความสะอาดพื้นฐาน รวดเร็ว ประหยัดเวลาสำหรับรถเก๋ง
            </p>
            <div className="price">150.-</div>
            <ul>
              <li>
                <i className="fas fa-check"></i> ล้างทำความสะอาดภายนอก
              </li>
              <li>
                <i className="fas fa-check"></i> ทำความสะอาดล้อและยาง
              </li>
              <li>
                <i className="fas fa-check"></i> ดูดฝุ่นภายในรถ
              </li>
              <li>
                <i className="fas fa-check"></i> เช็ดกระจกทั้งนอกและภายใน
              </li>
            </ul>
            <button className="btn-select">ขอจองบริการนี้</button>
          </div>

          <div className="package-card">
            <h3>ล้างสี - ดูดฝุ่น + เคลือบแว็กซ์</h3>
            <p
              style={{ fontSize: "12px", color: "#888", marginBottom: "15px" }}
            >
              ดูแลความสะอาดหมดจด พร้อมเพิ่มความเงางามและปกป้องสีรถ
            </p>
            <div className="price">300.-</div>
            <ul>
              <li>
                <i className="fas fa-check"></i> ล้างทำความสะอาดภายนอกและดูดฝุ่น
              </li>
              <li>
                <i className="fas fa-check"></i> ลงแว็กซ์เคลือบเงาสูตรพรีเมียม
              </li>
              <li>
                <i className="fas fa-check"></i> เช็ดทำความสะอาดกระจกและคอนโซล
              </li>
              <li>
                <i className="fas fa-check"></i> เคลือบเงายางและทำความสะอาดล้อ
              </li>
              <li>
                <i className="fas fa-check"></i> พ่นน้ำหอมปรับอากาศในห้องโดยสาร
              </li>
            </ul>
            <button className="btn-select">ขอจองบริการนี้</button>
          </div>
        </div>
      </section>

      <section className="ready-bg">
        <h2>พร้อมให้รถคันโปรดของคุณ กลับมาสวยเหมือนเดิมหรือยัง</h2>
        <div className="ready-btns">
          <Link to="/register" className="btn-cta reg">
            สมัครสมาชิก
          </Link>
          <Link to="/login" className="btn-cta log">
            เข้าสู่ระบบ
          </Link>
        </div>
      </section>
    </>
  );
}
