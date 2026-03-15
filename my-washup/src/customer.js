document.addEventListener("DOMContentLoaded", () => {
  // 1. โหลด Navbar (แยกระหว่างลูกค้า กับ พนักงาน)
  const navPlaceholder = document.getElementById("navbar-placeholder");
  const navStaffPlaceholder = document.getElementById(
    "navbar-staff-placeholder",
  );

  if (navPlaceholder) {
    // 🟢 ถ้าเป็นหน้าลูกค้า ให้ดึงเมนูลูกค้ามาแปะ
    fetch("components/navbar.html")
      .then((res) => res.text())
      .then((data) => {
        navPlaceholder.innerHTML = data;
        checkLoginStatus();
        setActiveMenu();
      });
  } else if (navStaffPlaceholder) {
    // 🔵 ถ้าเป็นหน้าพนักงาน ให้ดึงเมนูพนักงานมาแปะ
    fetch("components/navbar-staff.html")
      .then((res) => res.text())
      .then((data) => {
        navStaffPlaceholder.innerHTML = data;
        checkLoginStatus();
        setActiveMenu();
      });
  }

  // 2. โหลด Footer (ใช้ร่วมกันได้)
  fetch("components/footer.html")
    .then((res) => res.text())
    .then((data) => {
      const footer = document.getElementById("footer-placeholder");
      if (footer) footer.innerHTML = data;
    });

  // 3. จัดการปุ่มจองบริการทั้งหมด (เช็ค Login ก่อนจอง)
  document.body.addEventListener("click", (e) => {
    if (
      e.target.closest(".btn-booking-hero") ||
      e.target.closest(".btn-main-booking") ||
      e.target.closest(".btn-select")
    ) {
      e.preventDefault();
      if (!localStorage.getItem("user")) {
        alert("กรุณาเข้าสู่ระบบก่อนทำการจองบริการ");
        window.location.href = "Login.html";
      } else {
        window.location.href = "bookingnocar.html";
      }
    }
  });
});

function checkLoginStatus() {
  const userStr = localStorage.getItem("user");

  // 1. ถ้าไม่มีข้อมูล หรือเจอขยะคำว่า undefined ให้ข้ามไปเลย (โชว์ปุ่ม LOGIN/REGISTER ปกติ)
  if (!userStr || userStr === "undefined" || userStr === "null") return;

  try {
    const user = JSON.parse(userStr);

    // 2. เช็คให้ชัวร์ว่ามีข้อมูล user และมีชื่อ(login_name) จริงๆ เท่านั้น
    if (!user || !user.login_name) return;

    // 3. ถ้าของจริง ค่อยเปลี่ยนปุ่มเป็นสีแดง
    const authSectionCustomer = document.getElementById("nav-auth-section");
    if (authSectionCustomer) {
      authSectionCustomer.innerHTML = `
        <a href="profile.html" class="btn-user-badge">${user.login_name}</a>
        <button onclick="logoutUser()" class="btn-logout">LOGOUT</button>
      `;
    }

    const authSectionStaff = document.getElementById("nav-auth-section-staff");
    if (authSectionStaff) {
      authSectionStaff.innerHTML = `
        <span class="btn-user-badge">STAFF: ${user.login_name}</span>
        <button onclick="logoutUser()" class="btn-logout">LOGOUT</button>
      `;
    }
  } catch (error) {
    // ถ้าไฟล์ JSON พัง ให้ล้างขยะทิ้งไปเลย
    console.error("ข้อมูล User พัง, ล้างค่าใหม่");
    localStorage.removeItem("user");
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html"; // ไม่ว่าใคร Logout ก็เด้งกลับหน้า Landing Page ลูกค้า
}

function setActiveMenu() {
  const currentPath = window.location.pathname;

  // ไฮไลท์เมนูฝั่งลูกค้า
  if (currentPath.includes("index.html") || currentPath === "/") {
    const home = document.getElementById("nav-home");
    if (home) home.classList.add("active");
  } else if (currentPath.includes("booking")) {
    const booking = document.getElementById("nav-booking");
    if (booking) booking.classList.add("active");
  } else if (
    currentPath.includes("history") &&
    !currentPath.includes("staff")
  ) {
    const history = document.getElementById("nav-history");
    if (history) history.classList.add("active");
  }
}
