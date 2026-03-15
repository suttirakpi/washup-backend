// ดึง Navbar พนักงานมาแปะ (สังเกตว่าใช้ ../ นำหน้า เพราะเราถอยออกมา 1 โฟลเดอร์)
document.addEventListener("DOMContentLoaded", () => {
  fetch("../components/navbar-staff.html")
    .then((res) => res.text())
    .then((data) => {
      const navPlaceholder = document.getElementById(
        "navbar-staff-placeholder",
      );
      if (navPlaceholder) navPlaceholder.innerHTML = data;
    });

  fetch("../components/footer.html")
    .then((res) => res.text())
    .then((data) => {
      const footerPlaceholder = document.getElementById("footer-placeholder");
      if (footerPlaceholder) footerPlaceholder.innerHTML = data;
    });

  renderBoard(); // โหลดกระดาน
});

// 🚀 MOCK DATA
const mockJobs = [
  {
    id: "4010",
    car: "HONDA CIVIC",
    plate: "กข 1234 กทม.",
    package: "ล้างสี - ดูดฝุ่น",
    time: "10:30 น.",
    status: "pending",
  },
  {
    id: "4011",
    car: "TOYOTA CAMRY",
    plate: "วพ 5678 กทม.",
    package: "ล้างสี - ดูดฝุ่น + เคลือบแว็กซ์",
    time: "13:30 น.",
    status: "confirmed",
  },
];

function renderBoard() {
  document.getElementById("col-pending").innerHTML = "";
  document.getElementById("col-confirmed").innerHTML = "";

  mockJobs.forEach((job) => {
    let cardHTML = `
            <div class="job-card">
                <small>คิว #${job.id} | ⏰ ${job.time}</small>
                <h4>${job.car}</h4>
                <p><strong>ทะเบียน:</strong> ${job.plate}</p>
                <p><strong>บริการ:</strong> ${job.package}</p>
        `;

    if (job.status === "pending") {
      cardHTML += `<button class="btn-action btn-confirm" onclick="changeStatus('${job.id}', 'confirmed')">✅ ยืนยันรับคิว</button></div>`;
      document.getElementById("col-pending").innerHTML += cardHTML;
    } else if (job.status === "confirmed") {
      cardHTML += `<button class="btn-action btn-receive" onclick="changeStatus('${job.id}', 'inprogress')">📸 รับรถและบันทึกสภาพ</button></div>`;
      document.getElementById("col-confirmed").innerHTML += cardHTML;
    }
  });
}

function changeStatus(jobId, newStatus) {
  let jobIndex = mockJobs.findIndex((j) => j.id === jobId);
  if (jobIndex !== -1) {
    mockJobs[jobIndex].status = newStatus;
    renderBoard();
  }
}
