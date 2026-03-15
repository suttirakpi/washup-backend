// ==========================================
// 1. MOCK DATA (จัดเต็ม 4 คัน 4 สถานะ!)
// ==========================================
const mockJobs = [
  // คันที่ 1: รอยืนยัน
  {
    id: "4012",
    car: "NISSAN ALMERA",
    plate: "ขค 1122 กทม.",
    package: "ล้างสี - ดูดฝุ่น",
    time: "21 มี.ค. | 10:30 น.",
    status: "pending",
  },

  // คันที่ 2: รอรับรถ
  {
    id: "4010",
    car: "HONDA CIVIC",
    plate: "กข 1234 กทม.",
    package: "ล้างสี - ดูดฝุ่น + เคลือบแว็กซ์",
    time: "13:30 น.",
    status: "confirmed",
  },

  // คันที่ 3: กำลังล้าง
  {
    id: "3998",
    car: "TOYOTA CAMRY",
    plate: "วพ 5678 กทม.",
    package: "ล้างสี - ดูดฝุ่น",
    time: "13:35 น.",
    status: "inprogress",
  },

  // คันที่ 4: รอชำระเงิน
  {
    id: "3990",
    car: "MAZDA 2",
    plate: "พษ 9999 กทม.",
    package: "ล้างสี - ดูดฝุ่น",
    time: "14:00 น.",
    status: "ready",
  },
];

// ==========================================
// 2. ฟังก์ชันวาดกระดาน (Render Board)
// ==========================================
function renderBoard() {
  const colPending = document.getElementById("col-pending");
  const colConfirmed = document.getElementById("col-confirmed");
  const colInProgress = document.getElementById("col-inprogress");
  const colReady = document.getElementById("col-ready");

  // ถ้าหน้า HTML ใส่ ID ไม่ครบ ให้แจ้งเตือนใน Console จะได้รู้ว่าบั๊กตรงไหน
  if (!colPending || !colConfirmed || !colInProgress || !colReady) {
    console.error(
      "หา ID คอลัมน์ใน HTML ไม่เจอครับคุณตูน! เช็ค col-pending, col-confirmed, col-inprogress, col-ready ด่วน!",
    );
    return;
  }

  colPending.innerHTML = "";
  colConfirmed.innerHTML = "";
  colInProgress.innerHTML = "";
  colReady.innerHTML = "";

  mockJobs.forEach((job) => {
    let cardHTML = `
        <div class="job-card">
            <div class="card-top">
            <span class="job-id">JOB CARD #${job.id}</span>
            <span class="status-text ${
              job.status === "pending"
                ? "text-gray"
                : job.status === "confirmed"
                  ? "text-yellow"
                  : job.status === "inprogress"
                    ? "text-blue"
                    : "text-green"
            }">
                ${
                  job.status === "pending"
                    ? "รอยืนยัน"
                    : job.status === "confirmed"
                      ? "รอรับรถ"
                      : job.status === "inprogress"
                        ? "● IN PROGRESS"
                        : "พร้อมส่งมอบ"
                }
            </span>
            </div>
            <h3 class="car-title">${job.car}</h3>
            <p class="car-plate">${job.plate}</p>
            <div class="card-detail">
            <p>📅 ${job.time}</p>
            <p>🫧 ${job.package}</p>
            </div>
        `;

    if (job.status === "pending") {
      cardHTML += `
                <div class="btn-row">
                    <button class="btn btn-outline-gray">❌ [ ปฏิเสธ ]</button>
                    <button class="btn btn-green" onclick="promptConfirmBooking('${job.id}')">✅ [ ยืนยันรับคิว ]</button>
                </div>
            </div>`;
      colPending.innerHTML += cardHTML;
    } else if (job.status === "confirmed") {
      cardHTML += `
                <button class="btn btn-gray" style="margin-top: 10px;" onclick="promptCheckinBooking('${job.id}')">📸 [ รับรถและบันทึกสภาพ ]</button>
            </div>`;
      colConfirmed.innerHTML += cardHTML;
    } else if (job.status === "inprogress") {
      cardHTML += `
                <div style="text-align: right; margin: 15px 0 10px 0;">
                    <span style="color: #4285f4; font-weight: 600; font-size: 14px;">กำลังดำเนินการ...</span>
                </div>
                <button class="btn btn-blue" onclick="promptFinishWash('${job.id}')">💦 [ ล้างเสร็จสิ้น ]</button>
            </div>`;
      colInProgress.innerHTML += cardHTML;
    } else if (job.status === "ready") {
      // โชว์ในคอลัมน์สุดท้าย
      cardHTML += `
                <div class="payment-box">
                    <span>ยอดชำระ:</span>
                    <span class="payment-amount">300 THB</span>
                </div>
                <div class="btn-group">
                    <button class="btn btn-gray">🧾 [ พิมพ์ใบเสร็จ ]</button>
                    <button class="btn btn-red" onclick="promptPayment('${job.id}')">💰 [ ชำระเงินและจบงาน ]</button>
                </div>
            </div>`;
      colReady.innerHTML += cardHTML;
    }
  });
}

// ==========================================
// 3. ระบบจัดการสถานะและ POPUP
// ==========================================
let currentJobIdToConfirm = null;
let currentJobIdToCheckin = null;
let currentJobIdToFinish = null;

function changeStatus(jobId, newStatus) {
  let jobIndex = mockJobs.findIndex((j) => j.id === jobId);
  if (jobIndex !== -1) {
    mockJobs[jobIndex].status = newStatus;
    renderBoard();
  }
}

function openPopup(modalId) {
  document.getElementById(modalId).classList.add("active");
}
function closePopup(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// Popup ยืนยันรับคิว
function promptConfirmBooking(jobId) {
  currentJobIdToConfirm = jobId;
  openPopup("modal-confirm");
}
function confirmBookingFromPopup() {
  if (currentJobIdToConfirm) {
    changeStatus(currentJobIdToConfirm, "confirmed");
    closePopup("modal-confirm");
    currentJobIdToConfirm = null;
  }
}

// Popup บันทึกสภาพรถ
function promptCheckinBooking(jobId) {
  currentJobIdToCheckin = jobId;
  openPopup("modal-checkin");
}
function confirmCheckinFromPopup() {
  if (currentJobIdToCheckin) {
    changeStatus(currentJobIdToCheckin, "inprogress");
    closePopup("modal-checkin");
    currentJobIdToCheckin = null;
    // ถ้ามีกล่อง Text Area ให้เคลียร์ด้วย (ระวัง Error ถ้าไม่มีกล่องนี้)
    const textArea = document.querySelector(".form-textarea");
    if (textArea) textArea.value = "";
  }
}

// Popup ล้างเสร็จสิ้น
function promptFinishWash(jobId) {
  currentJobIdToFinish = jobId;
  openPopup("modal-finish-wash");
}
function confirmFinishWashFromPopup() {
  if (currentJobIdToFinish) {
    changeStatus(currentJobIdToFinish, "ready");
    closePopup("modal-finish-wash");
    currentJobIdToFinish = null;
  }
}

// โหลดกระดานครั้งแรก
document.addEventListener("DOMContentLoaded", () => {
  renderBoard();
});

// ==========================================
// 3.4 Popup ชำระเงินและจบงาน
// ==========================================
let currentJobIdToPay = null;

function promptPayment(jobId) {
  currentJobIdToPay = jobId;
  openPopup("modal-payment");
}

// ฟังก์ชันเวลากดเลือกวิธีชำระเงิน (เงินสด/โอน/บัตร)
function selectPaymentMethod(element) {
  // ล้างกรอบสีแดงออกจากทุกกล่องก่อน
  const boxes = document.querySelectorAll(".method-box");
  boxes.forEach((box) => box.classList.remove("active"));
  // เติมกรอบสีแดงให้กล่องที่เพิ่งคลิก
  element.classList.add("active");
}

function confirmPaymentFromPopup() {
  if (currentJobIdToPay) {
    // เมื่อจ่ายเงินเสร็จ ให้ลบการ์ดใบนี้ออกจากกระดาน (ถือว่าจบงาน)
    let jobIndex = mockJobs.findIndex((j) => j.id === currentJobIdToPay);
    if (jobIndex !== -1) {
      mockJobs.splice(jobIndex, 1); // ลบข้อมูลออกจาก Array
      renderBoard(); // วาดกระดานใหม่ การ์ดจะหายไป!
    }
    closePopup("modal-payment");
    currentJobIdToPay = null;
  }
}
