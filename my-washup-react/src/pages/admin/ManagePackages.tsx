import React, { useState, useEffect } from "react";
import "./ManagePackages.css";

export default function ManagePackages() {
  // เริ่มต้นเป็น Array ว่างๆ รอรับจาก Backend
  const [packages, setPackages] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    description: "",
    price: 0,
  }); // ใช้ _id ตาม MongoDB

  // 1. 🟢 ฟังก์ชันดึงข้อมูลแพ็คเกจทั้งหมด (GET)
  const fetchPackages = async () => {
    try {
      // รอแก้ URL เป็นของเพื่อน
      const res = await fetch("http://localhost:3000/api/packages");
      const data = await res.json();
      setPackages(data);
    } catch (err) {
      console.error("ดึงข้อมูลแพ็คเกจล้มเหลว:", err);
    }
  };

  // ดึงข้อมูลทันทีที่เปิดหน้านี้
  useEffect(() => {
    fetchPackages();
  }, []);

  const handleAddNew = () => {
    setEditMode(false);
    setFormData({ _id: "", name: "", description: "", price: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (pkg: any) => {
    setEditMode(true);
    setFormData(pkg);
    setIsModalOpen(true);
  };

  // 2. 🔴 ฟังก์ชันลบแพ็คเกจ (DELETE)
  const handleDelete = async (id: string) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแพ็คเกจนี้?")) {
      try {
        await fetch(`http://localhost:3000/api/packages/${id}`, {
          method: "DELETE",
        });
        fetchPackages(); // ลบเสร็จ สั่งดึงข้อมูลใหม่ให้ตารางอัปเดต
      } catch (err) {
        console.error("ลบไม่สำเร็จ:", err);
      }
    }
  };

  // 3. 🟡/🔵 ฟังก์ชันบันทึกข้อมูล (POST = เพิ่มใหม่, PUT = แก้ไข)
  const handleSave = async () => {
    try {
      if (editMode) {
        // อัปเดตของเดิม (PUT)
        await fetch(`http://localhost:3000/api/packages/${formData._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: formData.price,
          }),
        });
      } else {
        // เพิ่มของใหม่ (POST)
        await fetch("http://localhost:3000/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: formData.price,
          }),
        });
      }
      fetchPackages(); // เซฟเสร็จ ดึงข้อมูลใหม่
      setIsModalOpen(false); // ปิด Popup
    } catch (err) {
      console.error("บันทึกไม่สำเร็จ:", err);
    }
  };

  return (
    <div className="package-container">
      {/* Header Section ... (เหมือนเดิมเลยครับ) */}
      <div className="package-header">
        <div className="package-title">
          <h2>Manage Service Packages</h2>
          <p>
            Define and edit your car wash service pricing tiers by vehicle size.
          </p>
        </div>
        <button className="btn-add" onClick={handleAddNew}>
          + Add New Package
        </button>
      </div>

      {/* Table Section */}
      <div className="package-table-wrapper">
        <table className="package-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>Description</th>
              <th>Price</th>
              <th style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((pkg) => (
              <tr key={pkg._id}>
                {" "}
                {/* ใช้ _id ของ MongoDB */}
                <td style={{ fontWeight: "bold" }}>{pkg.name}</td>
                <td>{pkg.description}</td>
                <td style={{ fontWeight: "bold" }}>
                  {pkg.price.toLocaleString()}.-
                </td>
                <td style={{ textAlign: "center" }}>
                  <div
                    className="action-btns"
                    style={{ justifyContent: "center" }}
                  >
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(pkg)}
                    >
                      📝
                    </button>
                    {/* ส่ง _id ไปลบ */}
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(pkg._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing {packages.length} Active Packages</span>
        <span>
          © 2026 WASH UP Management Console. All pricing inclusive of local tax.
        </span>
      </div>

      {/* Modal Popup (เหมือนเดิมเลยครับ โค้ดไม่เปลี่ยน) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editMode ? "แก้ไขแพ็คเกจ" : "เพิ่มแพ็คเกจใหม่"}</h3>

            <div className="form-group">
              <label>ชื่อแพ็คเกจ (Service Name)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="เช่น ล้างสี-ดูดฝุ่น"
              />
            </div>

            <div className="form-group">
              <label>รายละเอียด (Description)</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="อธิบายรายละเอียดการล้าง..."
              ></textarea>
            </div>

            <div className="form-group">
              <label>ราคา (Price)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                ยกเลิก
              </button>
              <button className="btn-save" onClick={handleSave}>
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
