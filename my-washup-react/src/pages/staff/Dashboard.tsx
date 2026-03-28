import { useState, useEffect } from "react";
import "./dashboard.css";

interface Booking {
  booking_id: number;
  booking_datetime: string;
  status: string;
  customer_name?: string;
  vehicle: {
    brand: string;
    model: string;
    license_plate: string;
  };
  services?: string[];
}
export default function StaffDashboard() {
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<Booking | null>(
    null,
  ); // จำว่ากำลังกดคันไหน
  const [showInspectionModal, setShowInspectionModal] =
    useState<Booking | null>(null);

  const [carCondition, setCarCondition] = useState("ปกติ");
  const [staffNote, setStaffNote] = useState("");

  const [showCompleteModal, setShowCompleteModal] = useState<Booking | null>(
    null,
  ); // สำหรับ STEP 3

  // 1. ตัวแปรเก็บว่ากำลังเปิด Popup ชำระเงินของคันไหน
  const [showPaymentModal, setShowPaymentModal] = useState<Booking | null>(
    null,
  );

  // 2. เก็บช่องทางชำระเงิน (cash, transfer, credit)
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const fetchBookings = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("ไม่มี Token กรุณาล็อกอินใหม่");
      return;
    }

    fetch("http://localhost:3000/api/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
      })
      .catch((err) => console.error("โหลดข้อมูลพัง:", err));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ฟังก์ชันอัปเดตสถานะรถ (PUT)
  // 👈 เพิ่ม extraData เข้ามาเผื่อส่งข้อมูลอื่นนอกจาก status
  const updateStatus = async (
    bookingId: number,
    newStatus: string,
    extraData: any = {},
  ) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:3000/api/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // 👈 เอา extraData มารวมกับ status แล้วส่งไปทีเดียว
          body: JSON.stringify({ status: newStatus, ...extraData }),
        },
      );

      if (response.ok) {
        fetchBookings();
      } else {
        const data = await response.json();
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("เชื่อมต่อพัง:", err);
    }
  };

  const handlePayment = async (bookingId: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3000/api/payments", {
        // 🎯 เติม s และ /
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId, // 🎯 ส่ง ID ไปให้ Backend หาข้อมูล
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok || data.message === "ชำระเงินแล้ว") {
        // ✅ เคล็ดลับให้หายไปเลย: ใช้ setJobs กรอง (Filter) รถคันนี้ทิ้งออกจากหน้าจอทันที
        setJobs((prevJobs) =>
          prevJobs.filter((job) => job.booking_id !== bookingId),
        );
        setShowPaymentModal(null); // ปิด Popup
        alert("บันทึกการชำระเงินสำเร็จ!");
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("เชื่อมต่อพัง:", err);
    }
  };
  // ฟังก์ชันตัวช่วยดึงข้อมูลตาม Status ของ Backend
  const getJobs = (status: string) => jobs.filter((j) => j.status === status);

  // ฟังก์ชันตัวช่วยจัดรูปแบบเวลา
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getDate()} ${date.toLocaleString("th-TH", { month: "short" })} - ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} น.`;
  };

  return (
    <>
      <div className="staff-board-bg">
        <div className="board-grid-original">
          {/* ----- คอลัมน์ 1: รอยืนยัน (Backend = pending) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-darknavy">
              <div>
                <i className="fas fa-clock"></i> รอยืนยัน
              </div>
              <div className="col-count">{getJobs("pending").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("pending").map((job) => (
                <div
                  key={job.booking_id}
                  className="job-card-og border-darknavy"
                >
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle?.brand || "ไม่ระบุ"}{" "}
                      {job.vehicle?.model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle?.license_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    <button className="btn-sm btn-red">ปฏิเสธ</button>

                    {/* 🚀 แก้ตรงนี้ครับ เปลี่ยนจาก updateStatus เป็น setShowConfirmModal เพื่อเปิด Popup */}
                    <button
                      className="btn-sm btn-darknavy"
                      onClick={() => setShowConfirmModal(job)}
                    >
                      ยืนยันคิว
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----- คอลัมน์ 2: รอล้าง (Backend = confirmed) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-yellow">
              <div>
                <i className="fas fa-car"></i> รอล้าง
              </div>
              <div className="col-count">{getJobs("confirmed").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("confirmed").map((job) => (
                <div key={job.booking_id} className="job-card-og border-yellow">
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle?.brand || "ไม่ระบุ"}{" "}
                      {job.vehicle?.model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle?.license_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    {/* 🚀 แก้ตรงนี้ครับ เปลี่ยนจาก updateStatus เป็นเปิด Popup Inspection แทน */}
                    <button
                      className="btn-sm btn-darknavy"
                      style={{ width: "100%" }}
                      onClick={() => {
                        setCarCondition("ปกติ");
                        setStaffNote("");
                        setShowInspectionModal(job); // เปิด Popup ของคันนี้
                      }}
                    >
                      เริ่มล้างรถ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----- คอลัมน์ 3: กำลังล้าง (Backend = in_progress) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-blue">
              <div>
                <i className="fas fa-tint"></i> กำลังล้าง
              </div>
              <div className="col-count">{getJobs("washing").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("washing").map((job) => (
                <div key={job.booking_id} className="job-card-og border-blue">
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle?.brand || "ไม่ระบุ"}{" "}
                      {job.vehicle?.model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle?.license_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    {/* 🚀 แก้ตรงนี้ครับ เปลี่ยนให้มาเปิด Popup สีฟ้าแทน */}
                    <button
                      className="btn-sm btn-blue"
                      onClick={() => setShowCompleteModal(job)}
                    >
                      ล้างเสร็จสิ้น
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----- คอลัมน์ 4: รอชำระเงิน (Backend = completed) ----- */}
          <div className="col-wrapper">
            <div className="col-header bg-green">
              <div>
                <i className="fas fa-money-bill-wave"></i> รอชำระเงิน
              </div>
              <div className="col-count">{getJobs("completed").length} คัน</div>
            </div>
            <div className="col-body-dashed">
              {getJobs("completed").map((job) => (
                <div key={job.booking_id} className="job-card-og border-green">
                  <div className="card-top">
                    <span className="card-user">
                      {job.customer_name || "ลูกค้าทั่วไป"}
                    </span>{" "}
                    <span className="card-time">
                      {formatTime(job.booking_datetime)}
                    </span>
                  </div>
                  <div className="card-car-info">
                    <div className="car-model">
                      {job.vehicle?.brand || "ไม่ระบุ"}{" "}
                      {job.vehicle?.model || ""}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle?.license_plate || "ไม่ระบุ"}
                    </div>
                  </div>
                  <div className="card-services">
                    {/* เช็คว่ามีข้อมูล services จาก Backend ไหม */}
                    {job.services && job.services.length > 0 ? (
                      job.services.map((service, index) => (
                        <div key={index}>
                          <i className="fas fa-check-circle"></i> {service}
                        </div>
                      ))
                    ) : (
                      <div>
                        <i className="fas fa-exclamation-circle"></i>{" "}
                        รอระบุบริการ
                      </div>
                    )}
                  </div>
                  <div className="card-actions">
                    <button
                      className="btn-sm btn-green"
                      onClick={() => {
                        setPaymentMethod("cash"); // รีเซ็ตให้กลับมาเป็นเงินสดทุกครั้งที่เปิด
                        setShowPaymentModal(job); // เปิด Popup
                      }}
                    >
                      ชำระเงินเสร็จสิ้น
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 1: Popup ยืนยันการจอง */}
        {showConfirmModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "350px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#e8f5e9",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ color: "#4CAF50", fontSize: "40px" }}>✔</span>
              </div>

              <h3
                style={{
                  color: "#FF5722",
                  marginBottom: "10px",
                  fontSize: "18px",
                }}
              >
                STEP 1 : ยืนยันการจอง
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                ต้องการยืนยันรับคิวนี้ใช่หรือไม่?
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "25px",
                }}
              >
                การยืนยันนี้จะทำให้คิวล็อกช่วงเวลาทำงานของคุณทันที
              </p>

              <div style={{ display: "flex", gap: "15px" }}>
                <button
                  onClick={() => setShowConfirmModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#eeeeee",
                    color: "#666",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ยกเลิก
                </button>

                <button
                  onClick={async () => {
                    await updateStatus(
                      showConfirmModal.booking_id,
                      "confirmed",
                    ); // สั่งอัปเดตสถานะ
                    setShowConfirmModal(null); // ปิด Popup
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#A5F3D0",
                    color: "#065F46",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
        {/* STEP 2: Popup บันทึกสภาพรถ */}
        {showInspectionModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "380px",
                textAlign: "left",
              }}
            >
              {/* Header: USERNAME | JOB ID */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#e60000",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {showInspectionModal.customer_name || "USERNAME"}
                </span>
                <span style={{ color: "#999", fontSize: "12px" }}>
                  JOB ID : {showInspectionModal.booking_id}
                </span>
              </div>

              <h3
                style={{
                  color: "#FF5722",
                  marginBottom: "15px",
                  fontSize: "18px",
                  textAlign: "center",
                }}
              >
                STEP 2 : บันทึกสภาพรถ
              </h3>

              {/* ข้อมูลรถ */}
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "10px 15px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  🚗 {showInspectionModal.vehicle?.brand || "ไม่ระบุ"}{" "}
                  {showInspectionModal.vehicle?.model || ""}
                </div>
                <div style={{ marginTop: "5px" }}>
                  ⏰ ลูกค้าเข้า :{" "}
                  {formatTime(showInspectionModal.booking_datetime)} น.
                </div>
              </div>

              {/* ส่วนเลือกสภาพรถ */}
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: "10px",
                }}
              >
                สภาพรถ{" "}
                <span style={{ color: "red", fontSize: "11px" }}>
                  * ตัวอย่าง
                </span>
              </label>
              <div
                style={{ display: "flex", gap: "8px", marginBottom: "15px" }}
              >
                <button
                  onClick={() => setCarCondition("ปกติ")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "20px",
                    border: "1px solid #ddd",
                    fontSize: "10px",
                    cursor: "pointer",
                    background: carCondition === "ปกติ" ? "#f0f4f8" : "white",
                    color: carCondition === "ปกติ" ? "#003366" : "#666",
                    fontWeight: carCondition === "ปกติ" ? "bold" : "normal",
                  }}
                >
                  ปกติ (ไม่มีรอยขีดข่วน)
                </button>
                <button
                  onClick={() => setCarCondition("พบรอยขีดข่วน")}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "20px",
                    border: "1px solid #ddd",
                    fontSize: "10px",
                    cursor: "pointer",
                    background:
                      carCondition === "พบรอยขีดข่วน" ? "#f0f4f8" : "white",
                    color: carCondition === "พบรอยขีดข่วน" ? "#003366" : "#666",
                    fontWeight:
                      carCondition === "พบรอยขีดข่วน" ? "bold" : "normal",
                  }}
                >
                  พบรอยขีดข่วน/ความเสียหาย
                </button>
              </div>

              {/* 🎯 บล็อกพิมพ์บันทึกรายละเอียด (ห้ามขยับได้) */}
              <textarea
                placeholder="บันทึกรายละเอียด..."
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                style={{
                  width: "100%",
                  height: "80px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  padding: "10px",
                  boxSizing: "border-box",
                  fontSize: "13px",
                  fontFamily: "Kanit",
                  resize: "none", // 👈 ตรึงกล่อง ห้ามขยายขนาด
                }}
              ></textarea>

              {/* 🎯 ส่วนปุ่มกดล่างสุด (มีปุ่มยกเลิกเล็กกว่าตกลง) */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "15px",
                  alignItems: "center",
                }}
              >
                {/* ปุ่มยกเลิก (เล็กกว่า) */}
                <button
                  onClick={() => setShowInspectionModal(null)}
                  style={{
                    padding: "8px 20px", // ขนาดเล็กกว่า
                    background: "#f5f5f5",
                    color: "#666",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  ยกเลิก
                </button>

                {/* ปุ่มตกลง (ใหญ่เด่น) */}
                <button
                  onClick={async () => {
                    // 🚀 ส่งข้อมูลโน้ตและสภาพรถแนบไปกับสถานะ in_progress
                    await updateStatus(
                      showInspectionModal.booking_id,
                      "washing",
                      {
                        checkin_note: carCondition, // 💡 แอบเห็นหลังบ้านเพื่อนใช้คำว่า checkin_note แทน car_condition นะครับ
                        staff_note: staffNote,
                      },
                    );

                    setShowInspectionModal(null);
                  }}
                  className="btn-sm"
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#A5F3D0",
                    color: "#065F46",
                    borderRadius: "30px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
        {/* STEP 3: Popup ยืนยันการล้างเสร็จ */}
        {/* 🔵 STEP 3: Popup ล้างรถเสร็จสิ้น */}
        {showCompleteModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "350px",
                textAlign: "center",
              }}
            >
              {/* ไอคอนวงกลมถูกสีฟ้า */}
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ color: "#2563eb", fontSize: "40px" }}>✔</span>
              </div>

              <h3
                style={{
                  color: "#FF5722",
                  marginBottom: "10px",
                  fontSize: "18px",
                }}
              >
                STEP 3 : ล้างรถเสร็จสิ้น
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#333",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                ต้องการยืนยันการทำรายการใช่หรือไม่?
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "25px",
                }}
              >
                การยืนยันนี้จะส่งรถไปยังจุดรอชำระเงิน
              </p>

              <div style={{ display: "flex", gap: "15px" }}>
                {/* ปุ่มยกเลิก */}
                <button
                  onClick={() => setShowCompleteModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#eeeeee",
                    color: "#666",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  ยกเลิก
                </button>

                {/* ปุ่มตกลงสีฟ้า */}
                <button
                  onClick={async () => {
                    await updateStatus(
                      showCompleteModal.booking_id,
                      "completed",
                    ); // ยิงสถานะไปรอชำระเงิน
                    setShowCompleteModal(null); // ปิด Popup
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#a5b4fc",
                    color: "#3730a3",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 🟢 STEP 4: Popup ชำระเงิน */}
        {showPaymentModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              fontFamily: "Kanit",
            }}
          >
            <div
              style={{
                background: "white",
                padding: "30px",
                borderRadius: "20px",
                width: "90%",
                maxWidth: "380px",
                textAlign: "left",
              }}
            >
              {/* Header: USERNAME | JOB ID */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "15px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#e60000",
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {showPaymentModal.customer_name || "USERNAME"}
                </span>
                <span style={{ color: "#999", fontSize: "12px" }}>
                  JOB ID : {showPaymentModal.booking_id}
                </span>
              </div>

              {/* ข้อมูลรถ */}
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "10px 15px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  🚗 {showPaymentModal.vehicle?.brand || "ไม่ระบุ"}{" "}
                  {showPaymentModal.vehicle?.model || ""}
                </div>
                <div style={{ marginTop: "5px" }}>
                  ⏰ ลูกค้าเข้า :{" "}
                  {formatTime(showPaymentModal.booking_datetime)} น.
                </div>
              </div>

              {/* ยอดชำระ (ตอนนี้จำลองค่า 300 THB ไว้ก่อน เพราะ API ฝั่ง Backend ยังไม่ส่งราคาแยกมาให้ครับ) */}
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p
                  style={{
                    margin: 0,
                    color: "#666",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  ยอดชำระทั้งหมด
                </p>
                <h2
                  style={{
                    margin: "5px 0 0 0",
                    color: "#0F9D58",
                    fontSize: "36px",
                    fontWeight: "800",
                  }}
                >
                  300 THB
                </h2>
              </div>

              {/* ช่องทางชำระเงิน (กดแล้วกรอบแดงเปลี่ยน) */}
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                ช่องทางชำระเงิน
              </p>
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "25px" }}
              >
                <div
                  onClick={() => setPaymentMethod("cash")}
                  style={{
                    flex: 1,
                    border:
                      paymentMethod === "cash"
                        ? "2px solid #ff0000"
                        : "2px dashed #ccc",
                    borderRadius: "10px",
                    padding: "15px 5px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: paymentMethod === "cash" ? "#ff0000" : "#666",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "5px" }}>
                    💵
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                    เงินสด
                  </div>
                </div>
                <div
                  onClick={() => setPaymentMethod("transfer")}
                  style={{
                    flex: 1,
                    border:
                      paymentMethod === "transfer"
                        ? "2px solid #ff0000"
                        : "2px dashed #ccc",
                    borderRadius: "10px",
                    padding: "15px 5px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: paymentMethod === "transfer" ? "#ff0000" : "#666",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "5px" }}>
                    🏦
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                    โอนเงิน
                  </div>
                </div>
                <div
                  onClick={() => setPaymentMethod("credit")}
                  style={{
                    flex: 1,
                    border:
                      paymentMethod === "credit"
                        ? "2px solid #ff0000"
                        : "2px dashed #ccc",
                    borderRadius: "10px",
                    padding: "15px 5px",
                    textAlign: "center",
                    cursor: "pointer",
                    color: paymentMethod === "credit" ? "#ff0000" : "#666",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "5px" }}>
                    💳
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                    บัตรเครดิต
                  </div>
                </div>
              </div>

              {/* ปุ่มกด */}
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <button
                  onClick={() => setShowPaymentModal(null)}
                  style={{
                    padding: "8px 20px",
                    background: "#f5f5f5",
                    color: "#666",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handlePayment(showPaymentModal.booking_id)}
                  className="btn-sm"
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#A5F3D0",
                    color: "#065F46",
                    borderRadius: "30px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ยืนยันชำระเงิน
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
