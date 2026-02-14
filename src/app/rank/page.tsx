// src/app/rank/page.tsx
import Navbar from "@/components/Navbar";       // Import Navbar
import RankTable from "@/components/RankTable"; // Import Component vừa tách
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function RankPage() {
  // 1. Lấy thông tin User (Cookie & Database) để hiển thị Navbar
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId");
  const userIdString = userIdCookie?.value;
  const currentUserId = userIdString ? parseInt(userIdString) : null;

  let username = null;
  
  if (currentUserId) {
    try {
      const userList = await db.select().from(users).where(eq(users.id, currentUserId));
      if (userList.length > 0) {
        username = userList[0].username;
      }
    } catch (e) {
      console.log("Error fetching user for rank page:", e);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* 2. Hiển thị Navbar (Truyền đúng props) */}
      <Navbar userId={userIdString} username={username || undefined} />

      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Header trang */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            🏆 Bảng Xếp Hạng
          </h1>
          <p className="mt-2 text-gray-600">
            Vinh danh những thành viên kiên trì nhất cộng đồng
          </p>
        </div>

        {/* 3. Gọi Component RankTable (Truyền ID vào để nó biết ai là mình) */}
        <RankTable currentUserId={currentUserId} />

      </div>
    </main>
  );
}