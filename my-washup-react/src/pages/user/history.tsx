import React, { useState, useEffect } from 'react';
import { Car, Clock, RotateCcw, CheckCircle2 } from 'lucide-react';

interface Booking {
  booking_id: number;
  status: string;
  ui_status?: string;
  booking_datetime: string;
  total_price: number;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  services: string[];
}

const HistoryPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Mapping status ให้ตรงกับ Logic ของรูปภาพ
  const mapStatus = (status: string) => {
    switch (status) {
      case "pending": return "pending";
      case "confirmed": return "confirmed";
      case "washing": return "in_progress";
      case "completed": return "ready";
      case "cancelled": return "cancelled";
      default: return status;
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/bookings/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (response.ok) {
        const mapped = data.map((b: any) => ({
          ...b,
          ui_status: mapStatus(b.status)
        }));
        setBookings(mapped);
      }
    } catch (error) {
      console.error("Fetch history error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' }) + 
           ' – ' + date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const activeBookings = bookings.filter(b => 
    ['pending','confirmed','in_progress'].includes(b.ui_status || '')
  );

  const pastBookings = bookings.filter(b => 
    ['ready', 'cancelled'].includes(b.ui_status || '')
  );

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>กำลังโหลดข้อมูล...</div>;

  return (
    <div className="history-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;800&display=swap');
        
        .history-page { max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: 'Prompt', sans-serif; color: #333; }
        
        .header-section { margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .header-section h1 { font-size: 28px; font-weight: 800; margin: 0; color: #000; }
        .header-section p { font-size: 14px; color: #666; margin-top: 5px; }

        .section-title { font-size: 18px; font-weight: 700; color: #ff3b30; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .section-title.past { color: #555; margin-top: 50px; }
        .line-deco { flex-grow: 1; height: 1px; background: #eee; }

        .booking-card { background: #fff; border: 1px solid #e0e0e0; border-radius: 25px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        
        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .booking-info .id { font-size: 18px; font-weight: 700; color: #ff3b30; }
        .booking-info .date { font-size: 14px; color: #888; }
        .price-tag { background: #fee2e2; color: #ff3b30; padding: 8px 20px; border-radius: 15px; font-size: 24px; font-weight: 800; }

        .car-detail-box { display: flex; align-items: center; gap: 20px; background: #f9f9f9; padding: 20px; border-radius: 20px; margin-bottom: 25px; }
        .car-icon-circle { background: #ff3b30; color: #fff; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .info-grid { display: grid; grid-template-columns: auto 1fr; gap: 5px 15px; font-size: 15px; }
        .label { color: #888; }
        .value { font-weight: 600; color: #000; }

        /* Stepper UI */
        .stepper { display: flex; justify-content: space-between; position: relative; padding: 0 10px; margin-bottom: 20px; }
        .step { display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 2; opacity: 0.3; }
        .step.active { opacity: 1; }
        .circle { width: 35px; height: 35px; border-radius: 50%; border: 2px solid #ccc; display: flex; align-items: center; justify-content: center; background: white; font-size: 12px; color: #ccc; transition: 0.3s; }
        .step.active .circle { border-color: #ff3b30; background: #ff3b30; color: white; box-shadow: 0 0 10px rgba(255,59,48,0.3); }
        .step-text { font-size: 11px; font-weight: 700; color: #888; }
        .step.active .step-text { color: #ff3b30; }

        .cancel-link { text-align: right; margin-top: 15px; }
        .cancel-link button { color: #ff3b30; background: none; border: none; font-size: 14px; cursor: pointer; text-decoration: underline; font-family: inherit; }

        /* Past History */
        .past-card { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-radius: 20px; background: #fff; border: 1px solid #eee; margin-bottom: 15px; }
        .status-badge { padding: 6px 15px; border-radius: 10px; font-size: 13px; font-weight: 600; }
        .status-badge.ready { background: #dcfce7; color: #166534; }
        .status-badge.cancelled { background: #fee2e2; color: #991b1b; }
      `}</style>

      <div className="header-section">
        <h1>ประวัติและติดตามสถานะ</h1>
        <p>ติดตามและจัดการบริการล้างรถระดับพรีเมียมของคุณ</p>
      </div>

      <div className="section-title">
        <RotateCcw size={20} /> กำลังดำเนินการอยู่ <div className="line-deco"></div>
      </div>

      {activeBookings.length > 0 ? activeBookings.map(item => (
        <div key={item.booking_id} className="booking-card">
          <div className="card-top">
            <div className="booking-info">
              <div className="id">หมายเลขการจองที่ #{item.booking_id}</div>
              <div className="date">{formatDate(item.booking_datetime)}</div>
            </div>
            <div className="price-tag">{item.total_price} THB</div>
          </div>

          <div className="car-detail-box">
            <div className="car-icon-circle"><Car size={28} /></div>
            <div className="info-grid">
              <span className="label">ยี่ห้อรถ</span> <span className="value">: {item.vehicle_brand}</span>
              <span className="label">รุ่นรถ</span> <span className="value">: {item.vehicle_model}</span>
              <span className="label">ทะเบียนรถ</span> <span className="value">: {item.vehicle_plate}</span>
            </div>
          </div>

          <div className="stepper">
            <div className={`step ${['pending','confirmed','in_progress','ready'].includes(item.ui_status || '') ? 'active' : ''}`}>
              <div className="circle"><Clock size={16} /></div>
              <span className="step-text">Pending</span>
            </div>
            <div className={`step ${['confirmed','in_progress','ready'].includes(item.ui_status || '') ? 'active' : ''}`}>
              <div className="circle"><CheckCircle2 size={16} /></div>
              <span className="step-text">Confirmed</span>
            </div>
            <div className={`step ${['in_progress','ready'].includes(item.ui_status || '') ? 'active' : ''}`}>
              <div className="circle"><Car size={16} /></div>
              <span className="step-text">In Progress</span>
            </div>
            <div className={`step ${item.ui_status === 'ready' ? 'active' : ''}`}>
              <div className="circle"><CheckCircle2 size={16} /></div>
              <span className="step-text">Ready</span>
            </div>
          </div>

          
        </div>
      ) ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>ไม่มีรายการที่กำลังดำเนินการ</div>
      )}

      {pastBookings.length > 0 && (
        <>
          <div className="section-title past">
            <RotateCcw size={20} /> ประวัติการจองที่ผ่านมา <div className="line-deco"></div>
          </div>
          {pastBookings.map(item => (
            <div key={item.booking_id} className="past-card">
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>
                  {item.ui_status === 'ready' ? `การล้างรถทำเสร็จ #${item.booking_id}` : `ยกเลิกการจอง #${item.booking_id}`}
                </div>
                <div style={{ fontSize: '13px', color: '#888' }}>{formatDate(item.booking_datetime)}</div>
                <div style={{ fontSize: '13px', marginTop: '5px' }}>
                   {item.vehicle_brand} ({item.vehicle_plate})
                </div>
              </div>
              <div className={`status-badge ${item.ui_status}`}>
                {item.ui_status === 'ready' ? 'เสร็จสิ้น' : 'ยกเลิกแล้ว'}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default HistoryPage;