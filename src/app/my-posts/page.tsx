import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import { redirect, notFound } from "next/navigation"; // <-- IMPORT THÊM notFound
import ImageGallery from "@/components/ImageGallery";
import DeletePostButton from "@/components/DeletePostButton";
import EditableProfileHeader from "@/components/EditableProfileHeader"; // <-- IMPORT COMPONENT MỚI

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

  // 1. Lấy thông tin User đầy đủ hơn
  const u = await db.select().from(users).where(eq(users.id, currentUserId));
  const currentUser = u.length > 0 ? u[0] : null;

  if (!currentUser) return notFound();

  // --- LOGIC LẤY ẢNH MỚI NHẤT TỪ LỊCH SỬ ---
  // Lấy phần tử cuối cùng trong mảng. Nếu mảng rỗng hoặc bị null thì trả về null
  const latestAvatar = (currentUser.avatarUrls && Array.isArray(currentUser.avatarUrls) && currentUser.avatarUrls.length > 0) 
    ? currentUser.avatarUrls[currentUser.avatarUrls.length - 1] 
    : null;

  const latestCover = (currentUser.coverUrls && Array.isArray(currentUser.coverUrls) && currentUser.coverUrls.length > 0) 
    ? currentUser.coverUrls[currentUser.coverUrls.length - 1] 
    : null;

  // 2. LẤY BÀI VIẾT: Chỉ lấy bài của chính mình (eq(posts.userId, currentUserId))
  const myPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      images: posts.images,
      createdAt: posts.createdAt,
      username: users.username,
      avatarUrls: users.avatarUrls, // Lấy mảng avatar của người đăng bài để đồng bộ dữ liệu
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.userId, currentUserId)) // <-- BỘ LỌC Ở ĐÂY
    .orderBy(desc(posts.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar userId={currentUserId.toString()} username={currentUser.username} />

      <div className="max-w-2xl mx-auto py-10 px-4">
        
        {/* --- TRUYỀN ẢNH MỚI NHẤT VÀO HEADER --- */}
        <EditableProfileHeader 
          username={currentUser.username}
          avatarUrl={latestAvatar as string | null}
          coverUrl={latestCover as string | null}
          postCount={myPosts.length}
        />

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
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3 mt-2">
                    {post.content}
                  </p>
                )}

                {/* Gọi Component ImageGallery để hiển thị ảnh */}
                <ImageGallery images={post.images as string[] | null} />
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300 mt-8">
              Bạn chưa có bài đăng nào. Hãy qua Bảng tin để chia sẻ nhé!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}