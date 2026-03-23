const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/auth");


//  CREATE SERVICE  Role: admin เท่านั้น
router.post("/", authMiddleware, async (req, res) => {

  const serviceDB = mongoose.connection.collection("service");

  try {

    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const { service_name, description, price, type } = req.body;

    if (!service_name || !price) {
      return res.status(400).json({ message: "service_name and price required" });
    }

    const lastService = await serviceDB
      .find({})
      .sort({ service_id: -1 })
      .limit(1)
      .toArray();

    const service_id =
      lastService.length > 0 ? lastService[0].service_id + 1 : 3001;

    await serviceDB.insertOne({
      service_id,
      service_name,
      description,
      price,
      type: type || "main",
      is_active: true
    });

    res.json({
      message: "service created",
      service_id
    });

  } catch (error) {
    res.status(500).json({ message: "error creating service" });
  }

});


// ✅ GET PUBLIC Role: public (ทุกคน)
router.get("/", async (req, res) => {

  const serviceDB = mongoose.connection.collection("service");

  try {

    const { type } = req.query;

    let filter = { is_active: true };

    if (type) {
      filter.type = type;
    }

    const services = await serviceDB.find(filter).toArray();
    res.json(services);

  } catch (error) {
    res.status(500).json({ message: "error fetching services" });
  }

});


// ✅ GET Role: admin เท่านั้น
router.get("/admin", authMiddleware, async (req, res) => {

  const serviceDB = mongoose.connection.collection("service");

  try {

    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const services = await serviceDB.find().toArray();

    res.json(services);

  } catch (error) {
    res.status(500).json({ message: "error fetching services" });
  }

});


// ✅ UPDATE SERVICE Role: admin เท่านั้น
router.put("/:id", authMiddleware, async (req, res) => {

  const serviceDB = mongoose.connection.collection("service");

  try {

    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const serviceId = parseInt(req.params.id);
    const { service_name, description, price, is_active } = req.body;

    const result = await serviceDB.updateOne(
      { service_id: serviceId },
      {
        $set: {
          service_name,
          description,
          price,
          is_active
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "service not found" });
    }

    res.json({ message: "service updated" });

  } catch (error) {
    res.status(500).json({ message: "error updating service" });
  }

});


// ✅ DELETE SERVICE Role: admin เท่านั้น
router.delete("/:id", authMiddleware, async (req, res) => {

  const serviceDB = mongoose.connection.collection("service");

  try {

    if (req.user.user_role !== "admin") {
      return res.status(403).json({ message: "access denied" });
    }

    const serviceId = parseInt(req.params.id);

    const result = await serviceDB.deleteOne({
      service_id: serviceId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "service not found" });
    }

    res.json({ message: "service deleted" });

  } catch (error) {
    res.status(500).json({ message: "error deleting service" });
  }

});

module.exports = router;