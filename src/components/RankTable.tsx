// src/components/RankTable.tsx
import { db } from "@/db";
import { attendance, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

// Props: Nhận ID người đang xem để highlight
interface RankTableProps {
  currentUserId?: number | null;
}

export default async function RankTable({ currentUserId }: RankTableProps) {
  // 1. Query: Lấy Top 10 người sống dai nhất
  const leaderboard = await db
    .select({
      id: users.id,
      username: users.username,
      score: sql<number>`count(${attendance.id})`.mapWith(Number),
    })
    .from(users)
    .leftJoin(attendance, eq(users.id, attendance.userId))
    .where(eq(attendance.isPresent, true))
    .groupBy(users.id, users.username)
    .orderBy(desc(sql`count(${attendance.id})`))
    .limit(10);

  // 2. Query: Lấy điểm của riêng mình (nếu đã đăng nhập)
  let myScore = 0;
  if (currentUserId) {
    const myStats = await db
      .select({ count: sql<number>`count(*)` })
      .from(attendance)
      .where(eq(attendance.userId, currentUserId));
      
    myScore = Number(myStats[0]?.count || 0);
  }

  // Helper: Icon xếp hạng
  const getRankIcon = (index: number) => {
    if (index === 0) return "👑"; 
    if (index === 1) return "🥈"; 
    if (index === 2) return "🥉"; 
    return `#${index + 1}`;       
  };

  return (
    <div className="space-y-8">
      {/* --- PHẦN 1: CARD THÀNH TÍCH CÁ NHÂN --- */}
      {currentUserId ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-[1.01]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">
                Thành tích của bạn
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{myScore}</span>
                <span className="text-blue-200">ngày sống sót</span>
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm">
                🔥
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-blue-100">
            {myScore > 0 
              ? "Tiếp tục giữ vững phong độ nhé!" 
              : "Hãy bắt đầu điểm danh ngay hôm nay!"}
          </p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg shadow border border-orange-200 text-center">
            <p className="text-gray-600">
              <a href="/login" className="text-blue-600 font-bold hover:underline">Đăng nhập</a> để xem thứ hạng của bạn!
            </p>
        </div>
      )}

      {/* --- PHẦN 2: DANH SÁCH TOP 10 --- */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Top 10 Chiến Binh</h2>
          <span className="text-xs text-gray-400">Cập nhật realtime</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {leaderboard.length > 0 ? (
            leaderboard.map((user, index) => (
              <div 
                key={user.id} 
                className={`
                  flex items-center justify-between p-4 hover:bg-gray-50 transition
                  ${user.id === currentUserId ? "bg-blue-50/60 border-l-4 border-blue-500" : ""}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Cột Hạng */}
                  <div className={`
                    w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg
                    ${index === 0 ? "text-yellow-500 bg-yellow-50 shadow-sm" : ""}
                    ${index === 1 ? "text-gray-500 bg-gray-100 shadow-sm" : ""}
                    ${index === 2 ? "text-orange-600 bg-orange-50 shadow-sm" : ""}
                    ${index > 2 ? "text-gray-400 text-sm" : ""}
                  `}>
                    {getRankIcon(index)}
                  </div>

                  {/* Cột Tên */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-medium ${user.id === currentUserId ? "text-blue-700" : "text-gray-900"}`}>
                        {user.username} {user.id === currentUserId && "(Bạn)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cột Điểm */}
                <div className="text-right">
                  <span className="block text-lg font-bold text-gray-800">
                    {user.score}
                  </span>
                  <span className="text-xs text-gray-500 uppercase">ngày</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              Chưa có dữ liệu xếp hạng.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}