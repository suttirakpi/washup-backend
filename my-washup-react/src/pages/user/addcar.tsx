import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const AddCar = () => {
  const navigate = useNavigate();

  // 1. สร้าง State ให้ตรงกับที่ backend ต้องการ
  const [formData, setFormData] = useState({
    license_plate: '',
    vehicle_type_id: 1, // 1 สำหรับรถเก๋ง, 2 สำหรับ SUV
    brand: '',
    model: '',
    color: '',
    note: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. ฟังก์ชันเรียก API POST /api/vehicles
  const handleSubmit = async () => {
    // เช็คข้อมูลที่จำเป็น (ยกเว้น note)
    if (!formData.license_plate || !formData.brand || !formData.model || !formData.color) {
      alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    try {
      const token = localStorage.getItem('token'); 
      
      const response = await fetch('http://localhost:3000/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ต้องส่ง Token ไปตรวจสอบ
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert("บันทึกข้อมูลรถสำเร็จ!");
        navigate('/booking'); 
      } else {
        // ถ้าขึ้น invalid token ให้ผู้ใช้ไป login ใหม่
        alert(`ข้อผิดพลาด: ${data.message}`);
        if (data.message === "invalid token" || data.message === "no token") {
            navigate('/login');
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="add-car-root">
      <style>{`
        .add-car-root { background-color: #FAFAFA; min-height: 100vh; padding: 40px 20px; font-family: 'Inter', 'Prompt', sans-serif; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header-section { margin-bottom: 35px; border-left: 6px solid #ff0000; padding-left: 16px; }
        .input-group { margin-bottom: 25px; }
        .label-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .step-num { background: #FF3B30; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
        .input-label { font-size: 15px; font-weight: bold; color: #333; }
        .input-field { width: 100%; background: #EFEFEF; border: none; border-radius: 12px; padding: 14px 18px; font-size: 13px; outline: none; box-sizing: border-box; }
        .type-selector { display: flex; gap: 12px; }
        .type-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border-radius: 50px; border: 2px solid transparent; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.2s; }
        .type-btn.active { border-color: #FF3B30; background: #FFF5F5; color: #FF3B30; }
        .type-btn.inactive { background: #EFEFEF; color: #AAA; }
        .radio-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid #CCC; display: flex; align-items: center; justify-content: center; background: white; }
        .active .radio-dot { border-color: #FF3B30; }
        .radio-inner { width: 7px; height: 7px; background: #FF3B30; border-radius: 50%; }
        .footer-btns { display: flex; gap: 12px; margin-top: 40px; }
        .btn-cancel { flex: 1; background: #BBB; color: white; border: none; padding: 16px; border-radius: 16px; font-weight: bold; cursor: pointer; }
        .btn-save { flex: 1.5; background: #FF0000; color: white; border: none; padding: 16px; border-radius: 16px; font-weight: bold; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 5px 15px rgba(255,0,0,0.2); }
      `}</style>

      <div className="container">
        <div className="header-section">
          <h1 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>เพิ่มรถของคุณ</h1>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>ใส่ข้อมูลรถเพื่อเริ่มใช้บริการ WASH UP</p>
        </div>

        <div className="input-group">
          <div className="label-row"><div className="step-num">1</div><span className="input-label">ทะเบียนรถยนต์</span></div>
          <input name="license_plate" value={formData.license_plate} onChange={handleChange} type="text" placeholder="เช่น กข 1234 กรุงเทพฯ" className="input-field" />
        </div>

        <div className="input-group">
          <div className="label-row"><div className="step-num">2</div><span className="input-label">ประเภทรถของคุณ</span></div>
          <div className="type-selector">
            <div className={`type-btn ${formData.vehicle_type_id === 1 ? 'active' : 'inactive'}`} onClick={() => setFormData({...formData, vehicle_type_id: 1})}>
              <div className="radio-dot">{formData.vehicle_type_id === 1 && <div className="radio-inner" />}</div>
              รถเก๋ง
            </div>
            <div className={`type-btn ${formData.vehicle_type_id === 2 ? 'active' : 'inactive'}`} onClick={() => setFormData({...formData, vehicle_type_id: 2})}>
              <div className="radio-dot">{formData.vehicle_type_id === 2 && <div className="radio-inner" />}</div>
              รถกระบะ / SUV
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <div className="label-row"><div className="step-num">3</div><span className="input-label">แบรนด์</span></div>
            <input name="brand" value={formData.brand} onChange={handleChange} type="text" placeholder="HONDA" className="input-field" />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <div className="label-row"><div className="step-num">4</div><span className="input-label">รุ่น</span></div>
            <input name="model" value={formData.model} onChange={handleChange} type="text" placeholder="CIVIC" className="input-field" />
          </div>
        </div>

        <div className="input-group">
          <div className="label-row"><div className="step-num">5</div><span className="input-label">สีรถ</span></div>
          <input name="color" value={formData.color} onChange={handleChange} type="text" placeholder="เช่น สีขาว" className="input-field" />
        </div>

        <div className="input-group">
          <div className="label-row"><div className="step-num">6</div><span className="input-label">โน้ต (ไม่บังคับ)</span></div>
          <input name="note" value={formData.note} onChange={handleChange} type="text" placeholder="ระบุข้อมูลเพิ่มเติม..." className="input-field" />
        </div>

        <div className="footer-btns">
          <button className="btn-cancel" onClick={() => navigate(-1)}>ยกเลิก</button>
          <button className="btn-save" onClick={handleSubmit}>
            <Plus size={20} strokeWidth={3} /> บันทึกข้อมูลรถ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCar;