"use client";

import { useState, useEffect } from "react";
// Đảm bảo bạn đã import đúng đường dẫn tới file actions
import { toggleAliveStatus, getMonthlySurvival } from "@/app/actions"; 

const AttendanceCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aliveDays, setAliveDays] = useState<string[]>([]);

  // Lấy ngày hiện tại hệ thống (Local time) để so sánh
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Load dữ liệu khi tháng thay đổi
  useEffect(() => {
    const fetchData = async () => {
      const data = await getMonthlySurvival(month, year);
      setAliveDays(data);
    };
    fetchData();
  }, [month, year]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const handleCheckIn = async (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // --- CHẶN CLICK: Nếu không phải hôm nay thì không làm gì cả ---
    if (dateKey !== todayString) {
      return; 
    }

    // Optimistic UI update (Cập nhật giao diện trước cho mượt)
    const isCurrentlyAlive = aliveDays.includes(dateKey);
    const newAliveList = isCurrentlyAlive
      ? aliveDays.filter(d => d !== dateKey)
      : [...aliveDays, dateKey];
    
    setAliveDays(newAliveList);

    // Gọi Server Action
    try {
      await toggleAliveStatus(dateKey);
    } catch (error) {
      console.error("Lỗi:", error);
      setAliveDays(aliveDays); // Revert nếu lỗi
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Tháng {month + 1} / {year}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
          >
            &lt; Trước
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
          >
            Sau &gt;
          </button>
        </div>
      </div>

      {/* Grid Lịch */}
      <div className="grid grid-cols-7 gap-4">
        {/* Thứ trong tuần */}
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-400 py-2 text-sm">
            {day}
          </div>
        ))}

        {/* Ô trống đầu tháng */}
        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`}></div>
        ))}

        {/* Các ngày trong tháng */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          const isAlive = aliveDays.includes(dateKey); // Đã điểm danh?
          const isToday = dateKey === todayString;     // Có phải hôm nay?
          
          // Logic hiển thị chữ
          let statusText = isAlive ? "Còn sống" : "Mất tích";
          
          // Logic class CSS
          let containerClass = "bg-gray-100 border-gray-200 text-gray-500"; // Mặc định (Xám/Mất tích)
          
          if (isAlive) {
            containerClass = "bg-blue-500 border-blue-600 text-white shadow-md"; // Xanh dương (Còn sống)
          }

          // Xử lý riêng cho NGÀY HÔM NAY
          if (isToday) {
            // Thêm viền cam đậm
            containerClass += " border-2 border-orange-500 relative";
            
            // Nếu chưa điểm danh thì đổi chữ nhắc nhở
            if (!isAlive) {
                statusText = "Điểm danh ngay!";
                containerClass += " bg-orange-50 text-orange-600 animate-pulse"; // Nhấp nháy nhẹ nền cam nhạt
            }
          } else {
             // Các ngày khác thì mờ đi 1 chút nếu chưa điểm danh
             if (!isAlive) containerClass += " opacity-70";
          }

          return (
            <div
              key={day}
              onClick={() => handleCheckIn(day)}
              className={`
                ${containerClass}
                rounded-lg flex flex-col items-center justify-center
                aspect-square transition-all duration-200 select-none
                ${isToday ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"}
              `}
            >
              <span className="text-xl font-bold">{day}</span>
              <span className="text-[10px] uppercase font-bold mt-1">
                {statusText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendar;