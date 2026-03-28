import React, { useState, useEffect } from 'react';
import { Car, Plus, Check, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const BookingPage = () => {
  const navigate = useNavigate();
  
  // --- 1. States ---
  const [mainServices, setMainServices] = useState<any[]>([]); // ดึงจาก DB
  const [addons, setAddons] = useState<any[]>([]);             // ดึงจาก DB
  const [dates, setDates] = useState<any[]>([]);               // สร้างแบบ Dynamic
  const [selectedService, setSelectedService] = useState<number | ''>('');
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(''); // จะถูก set เมื่อโหลด dates เสร็จ
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  // --- 2. Logic สำหรับสร้างวันที่ (7 วันล่วงหน้า) ---
  const generateBookingDates = () => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.getDate().toString().padStart(2, '0');
    const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
    const fullDate = `${d.getFullYear()}-${monthStr}-${dateStr}`;
    
    result.push({
      day: days[d.getDay()],
      date: dateStr,
      fullDate: fullDate // เราจะใช้ตัวนี้เป็น ID หลัก
    });
  }
  return result;
};

  // --- 3. Effects (Fetching Data) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // 1. สร้างวันที่แบบ Dynamic
        const generatedDates = generateBookingDates();
        setDates(generatedDates);
        setSelectedDate(generatedDates[0].fullDate);

        // 2. Fetch Services จาก Database (แยก Main/Addons ตามช่วง ID)
        // หมายเหตุ: ใช้ endpoint เดียวกับที่คุณดึงในหน้าอื่น หรือสร้างใหม่ใน Backend
        const svcResponse = await fetch('http://localhost:3000/api/services'); 
        const svcResult = await svcResponse.json();
        if (svcResponse.ok) {
          const allServices = svcResult.data || svcResult;

            // แยกบริการหลักด้วย type: 'main'
            setMainServices(allServices.filter((s: any) => s.type === 'main').map((s: any) => ({
              id: s.service_id, 
              name: s.service_name, 
              price: s.price, 
              desc: s.description
            })));

            // แยกบริการเสริมด้วย type: 'extra'
            setAddons(allServices.filter((s: any) => s.type === 'extra').map((s: any) => ({
              id: s.service_id, 
              name: s.service_name, 
              price: s.price, 
              desc: s.description
            })));
        }

        // 3. Fetch Vehicles
        const vehResponse = await fetch('http://localhost:3000/api/vehicles/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehResult = await vehResponse.json();
        if (vehResponse.ok) {
          const vehicleData = vehResult.data || vehResult;
          if (Array.isArray(vehicleData) && vehicleData.length > 0) {
            setVehicles(vehicleData);
            const initialId = vehicleData[0].vehicle_id || vehicleData[0]._id;
            setSelectedVehicleId(initialId.toString());
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch Slots เมื่อวันที่เปลี่ยน
  // ค้นหา useEffect สำหรับ fetchSlots (ประมาณบรรทัดที่ 84)
useEffect(() => {
  const fetchSlots = async () => {
    if (!selectedDate) return;

    const token = localStorage.getItem('token');

    try {
      const slotResponse = await fetch(
        `http://localhost:3000/api/bookings/slots?date=${selectedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const slotResult = await slotResponse.json();

      if (slotResponse.ok) {
        setAllBookings(slotResult.data || slotResult);
      }
    } catch (error) {
      console.error("Fetch slots error:", error);
    }
  };

  fetchSlots();
}, [selectedDate]);
  // Preview ราคา (เรียก API preview ที่คุณเขียนไว้)
  useEffect(() => {
    const getPreview = async () => {
      if (!selectedVehicleId || !selectedService) return;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/bookings/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            vehicle_id: Number(selectedVehicleId),
            main_service: selectedService,
            extra_services: selectedAddons
          })
        });
        if (response.ok) setPreviewData(await response.json());
      } catch (err) { console.error("Preview error", err); }
    };
    getPreview();
  }, [selectedVehicleId, selectedService, selectedAddons]);

  // --- 4. Logic Functions ---
 // ค้นหา getTimeSlots (ประมาณบรรทัดที่ 113)
const getTimeSlots = () => {
  // 1. กำหนดรอบเวลาทั้งหมดที่ร้านเปิดให้บริการ
  const standardTimes = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30', '18:00'];

  return standardTimes.map(t => {
    // 2. ค้นหาในข้อมูลที่ดึงจาก DB (allBookings) ว่ามีคนจองรอบเวลานี้หรือยัง
    // ตรวจสอบว่า API ของคุณใช้ Key ชื่อ 'time' หรือ 'booking_time' ให้ตรงกัน
    const bookingData = Array.isArray(allBookings) 
      ? allBookings.find(b => b.time === t) 
      : null;

    if (bookingData) {
      // ถ้ามีข้อมูลการจองในรอบนี้ (เช่น { time: "09:00", count: 1, max: 2 })
      return {
        time: t,
        slot: `${bookingData.count} / ${bookingData.max}`,
        isFull: bookingData.count >= bookingData.max
      };
    } else {
      // ถ้ายังไม่มีคนจองเลยในรอบนี้ ให้แสดงเป็นค่าว่างเริ่มต้น
      return {
        time: t,
        slot: '0 / 2',
        isFull: false
      };
    }
  });
};

  const timeSlots = getTimeSlots();

  const toggleAddon = (id: number) => {
    setSelectedAddons(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleBooking = async () => {
  const vId = Number(selectedVehicleId);

  if (!selectedVehicleId || isNaN(vId) || !selectedService || !selectedTime) {
    alert('กรุณาเลือกข้อมูลให้ครบถ้วน');
    return;
  }

  // ✅ ใช้ตัวนี้ตัวเดียว
  const targetDate = selectedDate;

  const bookingDateTime = new Date(
    `${targetDate}T${selectedTime}:00+07:00`
  ).toISOString();

  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        vehicle_id: vId,
        booking_datetime: bookingDateTime,
        main_service: selectedService,
        extra_services: selectedAddons,
      })
    });

    if (response.ok) {
      alert('จองบริการสำเร็จ!');
      navigate('/history');
    } else {
      const result = await response.json();
      alert('จองไม่สำเร็จ: ' + (result.message || 'ตรวจสอบข้อมูลอีกครั้ง'));
    }
  } catch (error) {
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  }
};

  // --- 5. Render ---
  return (
    <div className="booking-page-root">
      <style>{`
        .booking-page-root { max-width: 600px; margin: 0 auto; padding: 30px 20px 100px; font-family: 'Inter', 'Prompt', sans-serif; background-color: #fafafa; color: #333; }
        .title-section { margin-bottom: 35px; }
        .main-title { font-size: 24px; font-weight: 800; margin-bottom: 4px; color: #000; }
        .sub-title { font-size: 11px; color: #888; letter-spacing: 0.02em; }
        .step-container { margin-bottom: 45px; }
        .step-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .step-num { background: #ff3b30; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
        .step-label { font-size: 16px; font-weight: 700; color: #444; }
        .car-list { display: flex; flex-direction: column; gap: 10px; }
        .car-card { display: flex; align-items: center; padding: 15px; background: white; border-radius: 16px; border: 2px solid transparent; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.02); transition: 0.2s; }
        .car-card.selected { border-color: #ff3b30; background: #fffcfc; }
        .car-info-main { flex: 1; margin-left: 15px; }
        .car-plate { font-size: 15px; font-weight: 800; color: #000; }
        .car-detail { font-size: 11px; color: #999; }
        .add-more-car { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: 1.5px dashed #ccc; border-radius: 12px; color: #888; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 10px; }
        .service-group-label { font-size: 12px; font-weight: 700; color: #bbb; margin-bottom: 15px; display: block; border-bottom: 1px solid #eee; padding-bottom: 8px; }
        .service-item { display: flex; align-items: flex-start; gap: 15px; padding: 18px; background: #f2f2f2; border-radius: 12px; margin-bottom: 10px; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
        .service-item.selected { border-color: #d40000; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
        .radio-circle { min-width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ccc; margin-top: 3px; display: flex; align-items: center; justify-content: center; }
        .selected .radio-circle { border-color: #d40000; }
        .radio-inner { width: 10px; height: 10px; background: #d40000; border-radius: 50%; }
        .service-info { flex: 1; }
        .service-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; display: block; }
        .service-desc { font-size: 9px; color: #aaa; line-height: 1.4; display: block; }
        .service-price { font-size: 13px; font-weight: 700; color: #999; margin-left: 10px; white-space: nowrap; }
        .selected .service-price { color: #d40000; }
        .date-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 25px; }
        .date-btn { display: flex; flex-direction: column; align-items: center; padding: 12px 0; background: #efefef; border-radius: 10px; border: none; cursor: pointer; }
        .date-btn.active { background: #d40000; color: white; }
        .date-day { font-size: 9px; font-weight: 700; margin-bottom: 4px; opacity: 0.6; }
        .date-num { font-size: 18px; font-weight: 800; }
        .time-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .time-btn { padding: 12px; background: #efefef; border-radius: 8px; border: none; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .time-btn.active { background: #fff; outline: 1.5px solid #ff3b30; color: #ff3b30; }
        .time-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #f5f5f5; color: #ccc; }
        .summary-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 15px 25px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 -5px 20px rgba(0,0,0,0.05); }
        .total-label { font-size: 10px; font-weight: 800; color: #bbb; text-transform: uppercase; }
        .total-val { font-size: 24px; font-weight: 900; color: #d40000; }
        .btn-submit { background: #d40000; color: white; padding: 14px 40px; border-radius: 12px; border: none; font-weight: 800; font-size: 14px; cursor: pointer; }
      `}</style>

      <div className="title-section">
        <h1 className="main-title">จองบริการล้างรถ</h1>
        <p className="sub-title">เลือกบริการที่ต้องการและระบุวันเวลาเพื่อเข้ารับบริการ</p>
      </div>

      {/* 1. Car Selection */}
      <div className="step-container">
        <div className="step-head"><div className="step-num">1</div><span className="step-label">ข้อมูลรถ</span></div>
        <div className="car-list">
          {vehicles.map(car => {
            const carId = (car.vehicle_id || car._id).toString();
            return (
              <div key={carId} className={`car-card ${selectedVehicleId === carId ? 'selected' : ''}`} onClick={() => setSelectedVehicleId(carId)}>
                <div className="radio-circle">{selectedVehicleId === carId && <div className="radio-inner" />}</div>
                <div className="car-info-main">
                  <div className="car-plate">{car.license_plate}</div>
                  <div className="car-detail">{car.brand} {car.model}</div>
                </div>
                <ChevronRight size={18} color="#ccc" />
              </div>
            );
          })}
          <Link to="/addcar" className="add-more-car"><Plus size={16} /> เพิ่มรถ</Link>
        </div>
      </div>

      {/* 2. Service Selection (จาก Database) */}
      <div className="step-container">
        <div className="step-head"><div className="step-num">2</div><span className="step-label">บริการและแพ็กเกจ</span></div>
        <span className="service-group-label">บริการหลัก</span>
        {mainServices.map(s => (
          <div key={s.id} className={`service-item ${selectedService === s.id ? 'selected' : ''}`} onClick={() => setSelectedService(s.id)}>
            <div className="radio-circle">{selectedService === s.id && <div className="radio-inner" />}</div>
            <div className="service-info"><span className="service-name">{s.name}</span><span className="service-desc">{s.desc}</span></div>
            <span className="service-price">{s.price} THB</span>
          </div>
        ))}
        <span className="service-group-label" style={{marginTop: '30px'}}>บริการเสริม</span>
        {addons.map(a => (
          <div key={a.id} className={`service-item ${selectedAddons.includes(a.id) ? 'selected' : ''}`} onClick={() => toggleAddon(a.id)}>
            <div className="radio-circle" style={{borderRadius: '4px'}}>{selectedAddons.includes(a.id) && <Check size={14} color="#d40000" strokeWidth={4} />}</div>
            <div className="service-info"><span className="service-name">{a.name}</span><span className="service-desc">{a.desc}</span></div>
            <span className="service-price">{a.price} THB</span>
          </div>
        ))}
      </div>

      {/* 3. DateTime Selection (แบบ Dynamic) */}
      <div className="step-container">
        <div className="step-head"><div className="step-num">3</div><span className="step-label">วันที่และเวลา</span></div>
        <div className="date-row">
          {dates.map(d => (
            <button key={d.date} className={`date-btn ${selectedDate === d.fullDate ? 'active' : ''}`} onClick={() => setSelectedDate(d.fullDate)}>
              <span className="date-day">{d.day}</span><span className="date-num">{d.date}</span>
            </button>
          ))}
        </div>
        <div className="time-row">
          {timeSlots.map(t => (
            <button key={t.time} disabled={t.isFull} className={`time-btn ${selectedTime === t.time ? 'active' : ''}`} onClick={() => setSelectedTime(t.time)}>
              <span className="time-val">{t.time}</span><span className="time-slot">{t.slot}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Summary Bar */}
      {selectedService && (
        <div className="summary-bar">
          <div>
            <div className="total-label">ยอดรวมสุทธิ</div>
            <div className="total-val">{previewData?.total_price || 0} <span style={{fontSize: '12px', color: '#999'}}>THB</span></div>
          </div>
          <button className="btn-submit" onClick={handleBooking}>ยืนยันการจอง</button>
        </div>
      )}
    </div>
  );
};

export default BookingPage;