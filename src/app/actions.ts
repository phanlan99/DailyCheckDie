'use server';

import { db } from '@/db';
import { attendance, users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm'; // Thêm gt (greater than) để so sánh thời gian
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import nodemailer from 'nodemailer'; // Import thư viện gửi mail

// =========================================================
// PHẦN 1: QUẢN LÝ TÀI KHOẢN (ĐĂNG KÝ / ĐĂNG NHẬP / ĐĂNG XUẤT)
// =========================================================

export async function registerUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const email = formData.get('email') as string | null;

  if (!username || !password) return { error: "Thiếu tên hoặc mật khẩu!" };

  // Kiểm tra trùng lặp Username
  const existingUser = await db.select().from(users).where(eq(users.username, username));
  if (existingUser.length > 0) return { error: "Tên đăng nhập đã tồn tại!" };

  // Kiểm tra trùng lặp Email (Nếu có nhập email)
  if (email) {
    const existingEmail = await db.select().from(users).where(eq(users.email, email));
    if (existingEmail.length > 0) return { error: "Email này đã được sử dụng!" };
  }

  try {
    await db.insert(users).values({ 
      username, 
      password, 
      email: email || null 
    });
  } catch (err) {
    return { error: "Lỗi hệ thống khi đăng ký" };
  }
  
  // Đăng ký xong thì tự động đăng nhập luôn
  return loginUser(formData);
}

export async function loginUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const userList = await db.select().from(users).where(
    and(
      eq(users.username, username),
      eq(users.password, password)
    )
  );

  if (userList.length === 0) {
    return { error: "Sai tên đăng nhập hoặc mật khẩu!" };
  }

  const user = userList[0];

  // Tạo Cookie phiên đăng nhập
  const cookieStore = await cookies();
  cookieStore.set('userId', user.id.toString(), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });

  redirect('/');
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/');
}

// =========================================================
// PHẦN 2: QUÊN MẬT KHẨU (OTP EMAIL) - MỚI THÊM
// =========================================================

// 2.1. GỬI MÃ OTP


export async function sendOtp(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) return { error: "Vui lòng nhập email!" };

  // Kiểm tra email có tồn tại không
  const userList = await db.select().from(users).where(eq(users.email, email));
  
  if (userList.length === 0) {
    return { error: "Email này chưa được đăng ký!" };
  }

  // LẤY USERNAME RA ĐỂ TRẢ VỀ
  const foundUser = userList[0];
  const username = foundUser.username;

  // Tạo mã OTP & Hạn sử dụng (Giữ nguyên logic cũ)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Lưu vào Database
  await db.update(users)
    .set({ otp: otpCode, otpExpires: expiresAt })
    .where(eq(users.email, email));

  // Gửi mail (Giữ nguyên logic cũ)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"GrowEveryDay App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Mã xác thực đổi mật khẩu",
      text: `Chào ${username}, mã OTP của bạn là: ${otpCode}`, // Nhắc tên trong mail luôn cho thân thiện
      html: `<b>Chào ${username},</b><br>Mã OTP của bạn là: <span style="font-size: 20px; color: blue;">${otpCode}</span>`,
    });
    
    // --- QUAN TRỌNG: Trả về cả username cho frontend ---
    return { success: true, email: email, username: username }; 

  } catch (error) {
    console.error(error);
    return { error: "Lỗi khi gửi email. Vui lòng thử lại." };
  }
}



// 2.2. XÁC THỰC OTP VÀ ĐỔI MẬT KHẨU
export async function resetPasswordWithOtp(formData: FormData) {
  const email = formData.get('email') as string;
  const otpInput = formData.get('otp') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!email || !otpInput || !newPassword) return { error: "Vui lòng điền đủ thông tin!" };

  // Tìm user khớp Email, khớp OTP và OTP chưa hết hạn (otpExpires > Hiện tại)
  const userList = await db.select().from(users).where(
    and(
      eq(users.email, email),
      eq(users.otp, otpInput),
      gt(users.otpExpires, new Date()) 
    )
  );

  if (userList.length === 0) {
    return { error: "Mã OTP không đúng hoặc đã hết hạn!" };
  }

  // Cập nhật mật khẩu mới và XÓA OTP cũ đi (để không dùng lại được)
  await db.update(users)
    .set({ password: newPassword, otp: null, otpExpires: null })
    .where(eq(users.email, email));

  return { success: true };
}

// =========================================================
// PHẦN 3: LOGIC ĐIỂM DANH (GIỮ NGUYÊN)
// =========================================================

export async function toggleAliveStatus(dateString: string) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');

  if (!userIdCookie) throw new Error("Chưa đăng nhập!");

  const userId = parseInt(userIdCookie.value);
  const today = new Date().toISOString().split('T')[0];

  if (dateString !== today) throw new Error("Sai ngày!");

  // Kiểm tra đã điểm danh chưa
  const existingRecord = await db.select().from(attendance).where(
    and(
      eq(attendance.date, dateString), 
      eq(attendance.userId, userId)
    )
  );

  if (existingRecord.length > 0) {
    // Hủy điểm danh
    await db.delete(attendance).where(
      and(
        eq(attendance.date, dateString), 
        eq(attendance.userId, userId)
      )
    );
    return { status: "missing" };
  } else {
    // Thêm điểm danh
    await db.insert(attendance).values({ 
      userId, 
      date: dateString, 
      isPresent: true 
    });
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