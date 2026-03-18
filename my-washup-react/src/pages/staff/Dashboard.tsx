import { useState, useEffect } from "react";

interface Booking {
  booking_id: number;
  booking_datetime: string;
  status: string;
  customer_name?: string; // 👈 เพิ่มไว้รับชื่อลูกค้า
  vehicle: {
    brand: string;
    model: string;
    license_plate: string;
  };
  services?: string[];
}
export default function StaffDashboard() {
  const [jobs, setJobs] = useState<Booking[]>([]);

  const fetchBookings = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("ไม่มี Token กรุณาล็อกอินใหม่");
      return;
    }

    // เหลือแค่อันนี้อันเดียวพอครับ
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

  // ดึงข้อมูลครั้งแรกตอนเปิดหน้าเว็บ
  useEffect(() => {
    fetchBookings();
  }, []);

  // 2️⃣ ฟังก์ชันอัปเดตสถานะรถ (PUT)
  const updateStatus = async (bookingId: number, newStatus: string) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `http://localhost:3000/api/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ยื่นบัตรผ่าน
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (response.ok) {
        // ✅ สั่งโหลดข้อมูลใหม่จาก Server ทันทีที่อัปเดตสำเร็จ
        fetchBookings();
      } else {
        const data = await response.json();
        alert("Error: " + data.message); // จะได้รู้ว่าทำไม Server ถึงไม่ยอมให้ผ่าน
      }
    } catch (err) {
      console.error("เชื่อมต่อพัง:", err);
    }
  };
  // ฟังก์ชันตัวช่วยดึงข้อมูลตาม Status ของ Backend
  const getJobs = (status: string) => jobs.filter((j) => j.status === status);

  // ฟังก์ชันตัวช่วยจัดรูปแบบเวลา (จาก 2023-10-27T10:00:00Z -> 27 ก.พ. - 10:00 น.)
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getDate()} ${date.toLocaleString("th-TH", { month: "short" })} - ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")} น.`;
  };

  return (
    <>
      {/* 🎨 CSS (ใช้ตัวเดิมที่คุณตูนเพิ่งขยายเต็มจอได้เลย ผมย่อไว้เพื่อประหยัดพื้นที่) */}
      <style>{`
        .staff-board-bg { background-color: #f8f9fa; padding: 40px 5%; min-height: 80vh; font-family: 'Kanit', sans-serif; }
        .board-grid-original { display: grid; grid-template-columns: repeat(4, 1fr); gap: 25px; width: 100%; }
        .col-wrapper { display: flex; flex-direction: column; gap: 15px; }
        .col-header { display: flex; justify-content: space-between; align-items: center; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600; }
        .col-count { font-weight: normal; font-size: 14px; }
        .col-body-dashed { border: 2px dashed #ccc; border-radius: 8px; padding: 15px; min-height: 500px; }
        .bg-darknavy { background-color: #2c3e50; } .bg-yellow { background-color: #fbbc05; color: #333 !important; } .bg-blue { background-color: #4285f4; } .bg-green { background-color: #0f9d58; }
        .job-card-og { background: #ffffff; border-radius: 10px; padding: 15px; margin-bottom: 15px; border: 1px solid #ddd; }
        .border-darknavy { border-color: #2c3e50; } .border-yellow { border-color: #fbbc05; } .border-blue { border-color: #4285f4; } .border-green { border-color: #0f9d58; }
        .card-top { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
        .card-user { color: #d71920; } .card-time { color: #888; font-weight: normal; }
        .card-car-info { margin-bottom: 10px; } .car-model { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 2px; } .car-license { font-size: 13px; color: #666; }
        .card-services { background-color: #f1f3f5; padding: 10px; border-radius: 6px; font-size: 12px; color: #555; margin-bottom: 15px; }
        .card-services div { margin-bottom: 4px; display: flex; align-items: center; gap: 6px; } .card-services i { color: #d71920; font-size: 10px; }
        .card-actions { display: flex; gap: 10px; justify-content: center; }
        .btn-sm { flex: 1; padding: 8px 0; border: none; border-radius: 20px; color: white; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-sm:hover { opacity: 0.9; }
        .btn-red { background-color: #d71920; } .btn-darknavy { background-color: #2c3e50; } .btn-yellow { background-color: #fbbc05; color: #333; } .btn-blue { background-color: #4285f4; } .btn-green { background-color: #0f9d58; }
      `}</style>

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
                      {job.vehicle.brand} {job.vehicle.model}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle.license_plate}
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
                    {/* 🚀 กดแล้วส่งสถานะ 'confirmed' ไปให้ Backend */}
                    {/* 🚀 ปุ่มยืนยันคิว ต้องส่ง "confirmed" ตัวพิมพ์เล็กทั้งหมดตาม Backend */}
                    <button
                      className="btn-sm btn-darknavy"
                      onClick={() => updateStatus(job.booking_id, "confirmed")}
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
                      {job.vehicle.brand} {job.vehicle.model}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle.license_plate}
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
                    <button className="btn-sm btn-red">ลูกค้ามาสาย</button>
                    {/* 🚀 กดแล้วส่งสถานะ 'in_progress' ไปให้ Backend */}
                    <button
                      className="btn-sm btn-yellow"
                      onClick={() =>
                        updateStatus(job.booking_id, "in_progress")
                      }
                    >
                      รับรถและเริ่มล้างรถ
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
              <div className="col-count">
                {getJobs("in_progress").length} คัน
              </div>
            </div>
            <div className="col-body-dashed">
              {getJobs("in_progress").map((job) => (
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
                      {job.vehicle.brand} {job.vehicle.model}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle.license_plate}
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
                    {/* 🚀 กดแล้วส่งสถานะ 'completed' ไปให้ Backend */}
                    <button
                      className="btn-sm btn-blue"
                      onClick={() => updateStatus(job.booking_id, "completed")}
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
                      {job.vehicle.brand} {job.vehicle.model}
                    </div>
                    <div className="car-license">
                      ทะเบียน: {job.vehicle.license_plate}
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
                    <button className="btn-sm btn-green">
                      ชำระเงินเสร็จสิ้น
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
