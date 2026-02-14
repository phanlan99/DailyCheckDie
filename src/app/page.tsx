// src/app/page.tsx
import Navbar from "@/components/Navbar";
import AttendanceCalendar from "@/components/AttendanceCalendar"; // Import vào

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        

        {/* Hiển thị Component Lịch */}
        <AttendanceCalendar />

      </div>
    </main>
  );
}