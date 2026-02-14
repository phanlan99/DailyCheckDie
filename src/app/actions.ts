'use server';

import { db } from '@/db';
import { attendance, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers'; // Để quản lý phiên đăng nhập
import { redirect } from 'next/navigation';

// --- 1. XỬ LÝ ĐĂNG KÝ ---
export async function registerUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const email = formData.get('email') as string | null;

  if (!username || !password) return { error: "Thiếu tên hoặc mật khẩu!" };

  // Kiểm tra trùng lặp
  const existingUser = await db.select().from(users).where(eq(users.username, username));
  if (existingUser.length > 0) return { error: "Tên đăng nhập đã tồn tại!" };

  try {
    // Lưu user mới (Password plain text như yêu cầu)
    await db.insert(users).values({ username, password, email });
  } catch (err) {
    return { error: "Lỗi hệ thống khi đăng ký" };
  }
  
  // Đăng ký xong thì tự động đăng nhập luôn cho tiện
  return loginUser(formData);
}

// --- 2. XỬ LÝ ĐĂNG NHẬP (QUAN TRỌNG NHẤT) ---
export async function loginUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Tìm user trong DB khớp cả Username và Password
  const userList = await db.select().from(users).where(
    and(
      eq(users.username, username),
      eq(users.password, password) // So sánh password gốc
    )
  );

  if (userList.length === 0) {
    return { error: "Sai tên đăng nhập hoặc mật khẩu!" };
  }

  const user = userList[0];

  // --- TẠO COOKIE (Đây là bước giúp bạn 'Vào được') ---
  // Lưu userId vào cookie để trình duyệt nhớ bạn là ai
  const cookieStore = await cookies();
  cookieStore.set('userId', user.id.toString(), {
    httpOnly: true, // Bảo mật, JS không đọc được
    path: '/',      // Dùng cho toàn bộ web
    maxAge: 60 * 60 * 24 * 7, // Lưu 7 ngày
  });

  redirect('/'); // Chuyển về trang chủ
}

// --- 3. XỬ LÝ ĐĂNG XUẤT ---
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/');
}

// --- 4. CÁC HÀM CŨ (GIỮ NGUYÊN) ---
export async function toggleAliveStatus(dateString: string) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');

  if (!userIdCookie) throw new Error("Chưa đăng nhập!"); // Chặn nếu không có cookie

  const userId = parseInt(userIdCookie.value);
  const today = new Date().toISOString().split('T')[0];

  if (dateString !== today) throw new Error("Sai ngày!");

  // Logic thêm/xóa điểm danh
  const existingRecord = await db.select().from(attendance).where(
    and(eq(attendance.date, dateString), eq(attendance.userId, userId))
  );

  if (existingRecord.length > 0) {
    await db.delete(attendance).where(and(eq(attendance.date, dateString), eq(attendance.userId, userId)));
    return { status: "missing" };
  } else {
    await db.insert(attendance).values({ userId, date: dateString, isPresent: true });
    return { status: "alive" };
  }
}

export async function getMonthlySurvival(month: number, year: number) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');
  if (!userIdCookie) return [];
  
  const userId = parseInt(userIdCookie.value);
  const records = await db.select().from(attendance).where(eq(attendance.userId, userId));
  return records.map(r => r.date);
}