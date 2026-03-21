const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    { vehicle_type_id: 1, name: "รถเก๋ง" },
    { vehicle_type_id: 2, name: "SUV / กระบะ" }
  ]);
});

module.exports = router;