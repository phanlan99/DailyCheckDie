// src/app/page.tsx
import Navbar from "@/components/Navbar";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  // 1. Lấy Cookie
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId");
  const userId = userIdCookie?.value;

  // 2. Lấy Tên User (Username) từ Database
  let username = null;
  if (userId) {
    try {
      // Ép kiểu userId sang number vì trong DB id là số (serial)
      const userList = await db.select().from(users).where(eq(users.id, parseInt(userId)));
      if (userList.length > 0) {
        username = userList[0].username;
      }
    } catch (e) {
      console.log("Lỗi lấy user:", e);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* 3. Truyền cả userId và username xuống Navbar */}
      <Navbar userId={userId} username={username || undefined} />

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bảng Điểm Danh</h1>
          <p className="mt-2 text-gray-600">
            {username 
              ? `Chào mừng ${username} quay lại! Hôm nay bạn thế nào?` 
              : "Bạn đang xem ở chế độ khách. Hãy đăng nhập để lưu dữ liệu nhé!"}
          </p>
        </div>

        {/* QUAN TRỌNG: Thêm prop key={userId || 'guest'}
          Khi userId thay đổi (đăng nhập/đăng xuất), React sẽ hủy component cũ 
          và tạo component mới -> Dữ liệu cũ (aliveDays) sẽ tự động reset sạch sẽ.
        */}
        <AttendanceCalendar userId={userId} key={userId || 'guest'} />
        
      </div>
    </main>
  );
}