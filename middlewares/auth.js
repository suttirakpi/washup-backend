const jwt = require("jsonwebtoken");
const { SECRET } = require("../config/auth");

function authMiddleware(req, res, next) {
  // 🔐 ดึง token จาก header
  const token = req.headers.authorization?.split(" ")[1];

  // ❌ ไม่มี token
  if (!token) {
    return res.status(401).json({ message: "no token" });
  }

  try {
    // 🔓 decode token
    const decoded = jwt.verify(token, SECRET);

    // ✅ เก็บ user ทั้งก้อน
    req.user = decoded;

    // ✅ เพิ่ม user_role ให้เรียกใช้ตรงๆ (กันพลาด)
    req.user_role = decoded.user_role;

    next(); // ไปต่อ
  } catch (error) {
    res.status(401).json({ message: "invalid token" });
  }
}

module.exports = authMiddleware;