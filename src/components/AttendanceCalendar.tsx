"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toggleAliveStatus, getMonthlySurvival } from "@/app/actions";

interface Props {
  userId?: string;
}

const AttendanceCalendar = ({ userId }: Props) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aliveDays, setAliveDays] = useState<string[]>([]);
  
  // --- LOGIC GIỮ NGUYÊN ---
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        const data = await getMonthlySurvival(month, year);
        setAliveDays(data);
      };
      fetchData();
    }
  }, [month, year, userId]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const handleCheckIn = async (day: number) => {
    if (!userId) {
      if (confirm("Bạn cần đăng nhập để điểm danh! Đi đến trang đăng nhập nhé?")) {
        router.push("/login");
      }
      return;
    }
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateKey !== todayString) return;

    const isCurrentlyAlive = aliveDays.includes(dateKey);
    const newAliveList = isCurrentlyAlive
      ? aliveDays.filter(d => d !== dateKey)
      : [...aliveDays, dateKey];
    setAliveDays(newAliveList);

    try {
      await toggleAliveStatus(dateKey);
    } catch (error) {
      console.error("Lỗi:", error);
      setAliveDays(aliveDays);
    }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  return (
    // Mobile: Padding nhỏ (p-3) | Desktop: Padding lớn (sm:p-6)
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6 w-full border border-gray-100">
      
      {/* Header: Thu nhỏ chữ và nút trên mobile */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
          Tháng {month + 1}/{year}
        </h2>
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={() => changeMonth(-1)}
            className="px-2 py-1 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition"
          >
            &lt; Trước
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-2 py-1 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition"
          >
            Sau &gt;
          </button>
        </div>
      </div>

      {/* Grid: Giảm khoảng cách (gap-2) trên mobile */}
      <div className="grid grid-cols-7 gap-1 sm:gap-4">
        {/* Thứ: Chữ nhỏ trên mobile */}
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-gray-400 py-1 sm:py-2 text-xs sm:text-sm">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, index) => (
          <div key={`empty-${index}`}></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isAlive = aliveDays.includes(dateKey);
          const isToday = dateKey === todayString;
          
          let statusText = isAlive ? "Còn sống" : "Mất tích";
          
          // Class cơ bản
          let containerClass = "bg-gray-50 border-gray-200 text-gray-400"; // Mặc định nhạt hơn
          
          if (isAlive) {
            // Xanh dương đậm đà hơn
            containerClass = "bg-blue-500 border-blue-600 text-white shadow-sm"; 
          }

          if (isToday) {
            containerClass += " border border-orange-500 relative";
            if (!isAlive) {
                statusText = "Điểm danh!";
                // Mobile: Nền cam nhạt nhấp nháy
                containerClass += " bg-orange-50 text-orange-600 animate-pulse"; 
            }
          } else {
             if (!isAlive) containerClass += " opacity-60";
          }

          return (
            <div
              key={day}
              onClick={() => handleCheckIn(day)}
              className={`
                ${containerClass}
                rounded-lg flex flex-col items-center justify-center
                aspect-square transition-all duration-200 select-none
                ${isToday ? "cursor-pointer active:scale-95" : "cursor-not-allowed"}
              `}
            >
              {/* SỐ NGÀY: Mobile chữ nhỏ (text-sm), Desktop chữ to (text-xl) */}
              <span className={`font-bold ${isToday ? "text-base sm:text-2xl" : "text-sm sm:text-xl"}`}>
                {day}
              </span>

              {/* --- GIAO DIỆN DESKTOP (Hiện chữ) --- */}
              <span className="hidden sm:block text-[10px] uppercase font-bold mt-1 text-center px-1 truncate w-full">
                {statusText}
              </span>

              {/* --- GIAO DIỆN MOBILE (Hiện chấm tròn / Icon) --- */}
              <div className="block sm:hidden mt-1">
                {isAlive ? (
                  // Icon CHECK (Nếu đã điểm danh)
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Logic hiển thị chấm
                  isToday ? (
                     // Hôm nay chưa điểm danh: Dấu chấm than đỏ/cam
                     <span className="text-xs font-bold text-orange-500">!</span>
                  ) : (
                     // Ngày thường chưa điểm danh: Chấm nhỏ
                     <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                  )
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttendanceCalendar;