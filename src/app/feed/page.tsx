import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import Image from "next/image"; // Import Image để hiển thị ảnh
import PostForm from "@/components/PostForm"; 

// Helper format thời gian
function formatTime(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', 
    minute: '2-digit', 
    day: '2-digit', 
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh' // <--- QUAN TRỌNG: Ép về giờ Việt Nam
  }).format(date);
}

export default async function FeedPage() {
  // 1. Lấy thông tin User hiện tại
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId");
  const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

  // Lấy tên User để hiển thị Navbar
  let currentUsername = undefined;
  if (userId) {
    const u = await db.select().from(users).where(eq(users.id, userId));
    if (u.length > 0) currentUsername = u[0].username;
  }

  // 2. Lấy danh sách bài viết (Mới nhất lên đầu)
  const allPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      imageUrl: posts.imageUrl, // Lấy link ảnh
      createdAt: posts.createdAt,
      username: users.username, 
      userId: users.id,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt));

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      <Navbar userId={userId?.toString()} username={currentUsername} />

      <div className="max-w-2xl mx-auto py-8 px-4">
        
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">📰 Bảng Tin Cộng Đồng</h1>
          <p className="text-gray-500 text-sm">Chia sẻ khoảnh khắc trong ngày của bạn</p>
        </div>

        {/* --- FORM ĐĂNG BÀI --- */}
        {userId ? (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 border border-gray-200">
            <PostForm />
          </div>
        ) : (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-8 text-center text-sm">
            <a href="/login" className="font-bold underline">Đăng nhập</a> để chia sẻ bài viết của bạn.
          </div>
        )}

        {/* --- DANH SÁCH BÀI VIẾT --- */}
        <div className="space-y-6"> 
          {allPosts.length > 0 ? (
            allPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition hover:shadow-md">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                      {post.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Nội dung chính */}
                  <div className="flex-1 w-full min-w-0"> 
                    
                    {/* Tên & Thời gian */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-900 mr-2">{post.username}</span>
                        {post.userId === userId && (
                           <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Bạn</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {formatTime(post.createdAt)}
                      </span>
                    </div>
                    
                    {/* Text content */}
                    {post.content && (
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3 text-sm sm:text-base">
                        {post.content}
                      </p>
                    )}

                    {/* Image content (Responsive giữ tỷ lệ gốc) */}
                    {post.imageUrl && (
                      <div className="mt-3 w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                        <Image 
                           src={post.imageUrl} 
                           alt="Post image" 
                           // Kỹ thuật của Next.js để ảnh Responsive theo chiều rộng mà giữ tỷ lệ gốc
                           width={0}
                           height={0}
                           sizes="100vw"
                           style={{ width: '100%', height: 'auto' }} 
                           className="hover:opacity-95 transition-opacity duration-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              Chưa có bài viết nào hôm nay. Hãy là người đầu tiên!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}