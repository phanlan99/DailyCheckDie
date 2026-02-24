// src/components/Navbar.tsx
import { cookies } from 'next/headers';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import NavbarUI from './NavbarUI'; // Import giao diện mới tách

// Chấp nhận (nhưng bỏ qua) props thừa để tránh gây lỗi ở các file page.tsx đang gọi Navbar cũ
export default async function Navbar(props: any) {
  // 1. Tự động kiểm tra đăng nhập và lấy userId
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');
  const userId = userIdCookie ? parseInt(userIdCookie.value) : null;

  let username = undefined;
  let avatarUrl = null;

  // 2. Chọc vào Database lấy thông tin
  if (userId) {
    const userRecord = await db.select().from(users).where(eq(users.id, userId));
    if (userRecord.length > 0) {
      const currentUser = userRecord[0];
      username = currentUser.username;
      
      // Lấy ảnh mới nhất
      if (currentUser.avatarUrls && Array.isArray(currentUser.avatarUrls) && currentUser.avatarUrls.length > 0) {
        avatarUrl = currentUser.avatarUrls[currentUser.avatarUrls.length - 1] as string;
      }
    }
  }

  // 3. Truyền dữ liệu tự động xuống giao diện
  return (
    <NavbarUI 
      userId={userId?.toString()} 
      username={username} 
      avatarUrl={avatarUrl} 
    />
  );
}