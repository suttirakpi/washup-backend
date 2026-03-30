import React, { useState } from "react";
import { Star, Car } from "lucide-react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    booking_id: number;
    vehicle_brand: string;
    vehicle_model: string;
  } | null;
  onSuccess: () => void;
}

const ReviewModal = ({ isOpen, onClose, booking, onSuccess }: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async () => {
    if (rating === 0) return alert("โปรดให้คะแนนดาวด้วยครับ");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          rating,
          comment,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("ขอบคุณสำหรับรีวิวครับ!"); // เมื่อสำเร็จครั้งแรก
        onSuccess();
        onClose();
      } else {
        // ✅ ถ้า Backend ส่ง Error กลับมา (เช่น กรณีรีวิวซ้ำ) ให้แสดงข้อความนี้
        if (data.message === "รีวิวแล้ว") {
          alert("คุณได้รีวิวแล้ว คุณสามารถรีวิวได้เพียงครั้งเดียว");
        } else {
          alert(data.message || "เกิดข้อผิดพลาด");
        }
      }
    } catch (error) {
      console.error("Review error:", error);
      alert("ไม่สามารถส่งรีวิวได้ในขณะนี้");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
          font-family: 'Prompt', sans-serif;
        }
        .modal-card {
          background: white;
          width: 100%; max-width: 400px;
          border-radius: 30px;
          padding: 40px 30px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .icon-header {
          position: relative;
          width: 100px; height: 100px;
          background: #fee2e2;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex; align-items: center; justify-content: center;
        }
        .icon-star-main { color: #facc15; }
        .icon-car-sub {
          position: absolute;
          bottom: 5px; right: -5px;
          background: #ff3b30;
          color: white;
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 3px solid white;
        }
        .modal-card h2 { font-size: 24px; font-weight: 800; margin: 0; color: #001a33; }
        .modal-card p { font-size: 13px; color: #888; margin: 8px 0 25px; }
        
        .rating-section { border-top: 1px solid #f0f0f0; padding-top: 20px; }
        .rating-label { font-size: 14px; font-weight: 700; color: #001a33; margin-bottom: 15px; }
        .stars-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 25px; }
        .star-btn { background: none; border: none; cursor: pointer; padding: 0; transition: 0.2s; }
        .star-btn:hover { transform: scale(1.1); }

        .comment-section { text-align: left; }
        .comment-label { font-size: 14px; font-weight: 700; color: #001a33; margin-bottom: 10px; display: block; }
        .comment-textarea {
          width: 100%; height: 120px;
          background: #f5f5f5;
          border: 1px solid #e5e5e5;
          border-radius: 20px;
          padding: 15px;
          font-family: inherit; font-size: 13px;
          resize: none; outline: none;
        }
        
        .modal-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px; }
        .btn-skip { 
          background: #c2c2c2; color: white; border: none; 
          padding: 12px; border-radius: 20px; font-weight: 700; cursor: pointer;
        }
        .btn-submit { 
          background: #ff3b30; color: white; border: none; 
          padding: 12px; border-radius: 20px; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
        }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="modal-card">
        <div className="icon-header">
          <Star size={48} fill="#facc15" className="icon-star-main" />
          <div className="icon-car-sub">
            <Car size={16} />
          </div>
        </div>

        <h2>รถเงาถูกใจไหมครับ?</h2>
        <p>รหัสการจองรถ #{booking.booking_id} | {booking.vehicle_brand} {booking.vehicle_model}</p>

        <div className="rating-section">
          <div className="rating-label">ให้คะแนนบริการ</div>
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                className="star-btn"
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(s)}
              >
                <Star
                  size={32}
                  fill={(hover || rating) >= s ? "#facc15" : "none"}
                  color={(hover || rating) >= s ? "#facc15" : "#e5e7eb"}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="comment-section">
          <label className="comment-label">ความคิดเห็นของคุณ</label>
          <textarea
            className="comment-textarea"
            placeholder="ระบุความประทับใจหรือส่วนที่อยากให้ปรับปรุง"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="modal-footer">
          <button className="btn-skip" onClick={onClose}>ข้าม</button>
          <button 
            className="btn-submit" 
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? "กำลังส่ง..." : "ส่งรีวิวเลย"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;