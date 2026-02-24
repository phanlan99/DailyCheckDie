import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import ImageGallery from "@/components/ImageGallery";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // <-- IMPORT THÊM ĐỂ HIỂN THỊ AVATAR VÀ COVER

// Hàm format thời gian (giữ nguyên)
function formatTime(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh'
  }).format(date);
}

// 1. SỬA ĐOẠN KHAI BÁO TYPE (Đổi thành Promise)
export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  
  // 2. THÊM DÒNG NÀY ĐỂ AWAIT PARAMS TRƯỚC
  const resolvedParams = await params;
  
  // 3. BÂY GIỜ MỚI ĐỌC ID
  const profileUserId = parseInt(resolvedParams.id);

  // Nếu ID không phải là số hợp lệ thì báo lỗi 404
  if (isNaN(profileUserId)) {
    notFound();
  }

  // 1. Lấy thông tin của người dùng đang được xem
  const profileUserList = await db.select().from(users).where(eq(users.id, profileUserId));
  if (profileUserList.length === 0) {
    notFound(); // Không tìm thấy người này trong database
  }
  
  const profileUser = profileUserList[0];
  const profileUsername = profileUser.username;

  // --- LẤY ẢNH MỚI NHẤT CỦA NGƯỜI NÀY ---
  const latestAvatar = (profileUser.avatarUrls && Array.isArray(profileUser.avatarUrls) && profileUser.avatarUrls.length > 0) 
    ? profileUser.avatarUrls[profileUser.avatarUrls.length - 1] 
    : null;
    
  const latestCover = (profileUser.coverUrls && Array.isArray(profileUser.coverUrls) && profileUser.coverUrls.length > 0) 
    ? profileUser.coverUrls[profileUser.coverUrls.length - 1] 
    : null;

  // 2. Lấy thông tin người đang đăng nhập (để hiển thị Navbar)
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("userId");
  const currentUserId = userIdCookie ? parseInt(userIdCookie.value) : null;
  
  let currentUsername = undefined;
  if (currentUserId) {
    const u = await db.select().from(users).where(eq(users.id, currentUserId));
    if (u.length > 0) currentUsername = u[0].username;
  }

  // 3. Lấy tất cả bài viết của người này
  const userPosts = await db
    .select({
      id: posts.id,
      content: posts.content,
      images: posts.images,
      oldImage: posts.oldImage, 
      createdAt: posts.createdAt,
      username: users.username,
      avatarUrls: users.avatarUrls, // Thêm dòng này để lấy avatar cho từng post nếu cần
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.userId, profileUserId)) 
    .orderBy(desc(posts.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <Navbar userId={currentUserId?.toString()} username={currentUsername} />

      <div className="max-w-2xl mx-auto py-10 px-4">
        
        {/* Nút quay lại */}
        <div className="mb-6">
          <Link href="/feed" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
            <span>&larr;</span> Quay lại Bảng tin
          </Link>
        </div>

        {/* --- HEADER TRANG CÁ NHÂN (CẬP NHẬT ẢNH BÌA VÀ AVATAR) --- */}
        <div className="bg-white rounded-xl shadow-sm mb-8 border border-gray-100 overflow-hidden relative">
          
          {/* Ảnh bìa */}
          <div className="relative w-full h-48 bg-gray-200">
            {latestCover ? (
              <Image src={latestCover as string} alt="Cover" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600 opacity-80"></div>
            )}
          </div>

          {/* Avatar & Thông tin */}
          <div className="px-6 pb-6 relative">
            <div className="relative -mt-12 mb-4 w-24 h-24 mx-auto sm:mx-0 sm:ml-4">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold shadow-md overflow-hidden relative">
                {latestAvatar ? (
                  <Image src={latestAvatar as string} alt="Avatar" fill className="object-cover" />
                ) : (
                  profileUsername.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="text-center sm:text-left sm:ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{profileUsername}</h1>
              <p className="text-gray-500 mt-1">Thành viên năng nổ • Đã đăng {userPosts.length} bài</p>
            </div>
          </div>
        </div>

        {/* Danh sách bài viết (KHÔNG CÓ NÚT XÓA) */}
        <div className="space-y-4">
          {userPosts.length > 0 ? (
            userPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                     
                     {/* --- HIỂN THỊ AVATAR TRONG BÀI VIẾT (TÙY CHỌN, HIỆN TẠI VẪN LÀ CHỮ) --- */}
                     {/* Nếu muốn đồng nhất với bảng tin, bạn có thể copy đoạn code lấy latestAvatar ở FeedPage sang đây */}
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden relative border border-gray-200 shadow-sm">
                        {(() => {
                           // Tương tự như FeedPage, lấy avatar cho từng post
                           const postAvatar = (post.avatarUrls && Array.isArray(post.avatarUrls) && post.avatarUrls.length > 0)
                            ? post.avatarUrls[post.avatarUrls.length - 1]
                            : null;
                            
                           if (postAvatar) {
                              return <Image src={postAvatar as string} alt="Avatar" fill className="object-cover"/>
                           }
                           return post.username.charAt(0).toUpperCase();
                        })()}
                     </div>
                     
                     <div>
                       <span className="block font-bold text-gray-900 leading-tight">{post.username}</span>
                       <span className="text-xs text-gray-400">{formatTime(post.createdAt)}</span>
                     </div>
                  </div>
                </div>
                
                {post.content && (
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3 mt-3">
                    {post.content}
                  </p>
                )}

                {(() => {
                  let displayImages: string[] = [];
                  
                  if (post.images && Array.isArray(post.images) && post.images.length > 0) {
                    displayImages = post.images as string[]; 
                  } else if (post.oldImage) {
                    displayImages = [post.oldImage as string]; 
                  }

                  return <ImageGallery images={displayImages} />;
                })()}

              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              {profileUsername} chưa đăng bài viết nào.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}