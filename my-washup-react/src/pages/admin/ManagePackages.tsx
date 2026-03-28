import React, { useState, useEffect } from "react";
import "./ManagePackages.css";

export default function ManagePackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    service_id: "",
    service_name: "",
    description: "",
    price: 0,
  });

  // 1. 🟢 ดึงข้อมูลแพ็คเกจ (ใช้เส้นทาง Admin และส่ง Token)
  const fetchPackages = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:3000/api/services/admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (err) {
      console.error("ดึงข้อมูลแพ็คเกจล้มเหลว:", err);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleAddNew = () => {
    setEditMode(false);
    setFormData({
      service_id: "",
      service_name: "",
      description: "",
      price: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (pkg: any) => {
    setEditMode(true);
    setFormData({
      service_id: pkg.service_id,
      service_name: pkg.service_name,
      description: pkg.description,
      price: pkg.price,
    });
    setIsModalOpen(true);
  };

  // 2. 🔴 ลบแพ็คเกจ (ยิงไปที่ /api/services/:id)
  const handleDelete = async (id: string | number) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบแพ็คเกจนี้?")) {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`http://localhost:3000/api/services/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) fetchPackages();
      } catch (err) {
        console.error("ลบไม่สำเร็จ:", err);
      }
    }
  };

  // 3. 🟡/🔵 บันทึกข้อมูล (POST/PUT ไปที่ /api/services)
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    const url = editMode
      ? `http://localhost:3000/api/services/${formData.service_id}`
      : "http://localhost:3000/api/services";

    try {
      const res = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          service_name: formData.service_name,
          description: formData.description,
          price: formData.price,
          is_active: true,
          type: "main",
        }),
      });

      if (res.ok) {
        fetchPackages();
        setIsModalOpen(false);
      } else {
        const errData = await res.json();
        alert("Error: " + errData.message);
      }
    } catch (err) {
      console.error("บันทึกไม่สำเร็จ:", err);
    }
  };

  return (
    <div className="package-container">
      <div className="package-header">
        <div className="package-title">
          <h2>Manage Service Packages</h2>
          <p>Define and edit your car wash service pricing tiers.</p>
        </div>
        <button className="btn-add" onClick={handleAddNew}>
          + Add New Package
        </button>
      </div>

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
              <tr key={pkg.service_id}>
                <td style={{ fontWeight: "bold" }}>{pkg.service_name}</td>
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
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(pkg.service_id)}
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
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editMode ? "แก้ไขแพ็คเกจ" : "เพิ่มแพ็คเกจใหม่"}</h3>
            <div className="form-group">
              <label>ชื่อแพ็คเกจ</label>
              <input
                type="text"
                value={formData.service_name}
                onChange={(e) =>
                  setFormData({ ...formData, service_name: e.target.value })
                }
                placeholder="เช่น ล้างสี-ดูดฝุ่น"
              />
            </div>
            <div className="form-group">
              <label>รายละเอียด</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              ></textarea>
            </div>
            <div className="form-group">
              <label>ราคา</label>
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
