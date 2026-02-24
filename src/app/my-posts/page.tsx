import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";
import ImageGallery from "@/components/ImageGallery";
import DeletePostButton from "@/components/DeletePostButton"; // Import nút xóa

function formatTime(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
  }).format(date);
}

export default async function MyPostsPage() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId");
  
  if (!userIdCookie) {
    redirect("/login"); // Chưa đăng nhập thì đuổi ra trang login
  }

  const currentUserId = parseInt(userIdCookie.value);

  // Lấy tên User
  const u = await db.select().from(users).where(eq(users.id, currentUserId));
  const currentUsername = u.length > 0 ? u[0].username : "User";

  // LẤY BÀI VIẾT: Chỉ lấy bài của chính mình (eq(posts.userId, currentUserId))
  const myPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      images: posts.images,
      createdAt: posts.createdAt,
      username: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.userId, currentUserId)) // <-- BỘ LỌC Ở ĐÂY
    .orderBy(desc(posts.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar userId={currentUserId.toString()} username={currentUsername} />

      <div className="max-w-2xl mx-auto py-10 px-4">
        
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md mb-4">
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{currentUsername}</h1>
          <p className="text-gray-500 mt-1">Đã đăng {myPosts.length} bài viết</p>
        </div>

        {/* Danh sách bài viết */}
        <div className="space-y-4">
          {myPosts.length > 0 ? (
            myPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <span className="font-bold text-gray-900">{post.username}</span>
                     <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                  </div>
                  
                  {/* Gắn nút xóa vào đây */}
                  <DeletePostButton postId={post.id} />
                  
                </div>
                
                {post.content && (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
                    {post.content}
                  </p>
                )}

                <ImageGallery images={post.images} />
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              Bạn chưa có bài đăng nào. Hãy qua Bảng tin để chia sẻ nhé!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}