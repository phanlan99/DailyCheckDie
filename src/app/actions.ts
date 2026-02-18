'use server';

import { db } from '@/db';
import { attendance, users, posts } from '@/db/schema';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary'; 
import { eq, and, gte, lt, desc, gt } from 'drizzle-orm';

// --- CẤU HÌNH CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =========================================================
// PHẦN 1: QUẢN LÝ TÀI KHOẢN (ĐĂNG KÝ / ĐĂNG NHẬP / ĐĂNG XUẤT)
// =========================================================

export async function registerUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const email = formData.get('email') as string | null;

  if (!username || !password) return { error: "Thiếu tên hoặc mật khẩu!" };

  const existingUser = await db.select().from(users).where(eq(users.username, username));
  if (existingUser.length > 0) return { error: "Tên đăng nhập đã tồn tại!" };

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

  const cookieStore = await cookies();
  cookieStore.set('userId', user.id.toString(), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, 
  });

  redirect('/');
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/');
}

// =========================================================
// PHẦN 2: QUÊN MẬT KHẨU (OTP EMAIL)
// =========================================================

export async function sendOtp(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) return { error: "Vui lòng nhập email!" };

  const userList = await db.select().from(users).where(eq(users.email, email));
  
  if (userList.length === 0) {
    return { error: "Email này chưa được đăng ký!" };
  }

  const foundUser = userList[0];
  const username = foundUser.username;

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.update(users)
    .set({ otp: otpCode, otpExpires: expiresAt })
    .where(eq(users.email, email));

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
      text: `Chào ${username}, mã OTP của bạn là: ${otpCode}`,
      html: `<b>Chào ${username},</b><br>Mã OTP của bạn là: <span style="font-size: 20px; color: blue;">${otpCode}</span>`,
    });
    
    return { success: true, email: email, username: username }; 

  } catch (error) {
    console.error(error);
    return { error: "Lỗi khi gửi email. Vui lòng thử lại." };
  }
}

export async function resetPasswordWithOtp(formData: FormData) {
  const email = formData.get('email') as string;
  const otpInput = formData.get('otp') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!email || !otpInput || !newPassword) return { error: "Vui lòng điền đủ thông tin!" };

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

  await db.update(users)
    .set({ password: newPassword, otp: null, otpExpires: null })
    .where(eq(users.email, email));

  return { success: true };
}

// =========================================================
// PHẦN 3: LOGIC ĐIỂM DANH
// =========================================================

export async function toggleAliveStatus(dateString: string) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');

  if (!userIdCookie) throw new Error("Chưa đăng nhập!");

  const userId = parseInt(userIdCookie.value);
  const today = new Date().toISOString().split('T')[0];

  if (dateString !== today) throw new Error("Sai ngày!");

  const existingRecord = await db.select().from(attendance).where(
    and(
      eq(attendance.date, dateString), 
      eq(attendance.userId, userId)
    )
  );

  if (existingRecord.length > 0) {
    await db.delete(attendance).where(
      and(
        eq(attendance.date, dateString), 
        eq(attendance.userId, userId)
      )
    );
    return { status: "missing" };
  } else {
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

// =========================================================
// PHẦN 4: HÀM HỖ TRỢ UPLOAD CLIENT-SIDE (MỚI THÊM)
// =========================================================

export async function getCloudinarySignature() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');
  if (!userIdCookie) throw new Error("Unauthorized");
  
  const userId = userIdCookie.value;

  // Cấu hình tham số upload để tạo chữ ký
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `dailyday/user_${userId}`; // Thư mục riêng cho user

  // Tạo chữ ký bảo mật bằng API Secret (Server-side only)
  const signature = cloudinary.utils.api_sign_request({
    timestamp: timestamp,
    folder: folder,
  }, process.env.CLOUDINARY_API_SECRET!);

  // Trả về thông tin cần thiết cho Client để tự upload
  return {
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  };
}

// =========================================================
// PHẦN 5: HÀM ĐĂNG BÀI VIẾT (CẬP NHẬT: NHẬN LINK ẢNH)
// =========================================================

export async function createPost(formData: FormData) {
  const content = formData.get('content') as string;
  const imageUrl = formData.get('imageUrl') as string | null; 
  
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');
  if (!userIdCookie) return { error: "Bạn cần đăng nhập để đăng bài!" };
  
  const userId = parseInt(userIdCookie.value);

  // Validate: Phải có Content HOẶC có Ảnh
  if ((!content || content.trim().length === 0) && !imageUrl) {
    return { error: "Bạn phải viết gì đó hoặc đăng ảnh!" };
  }

  // --- LOGIC MỚI: TÍNH NGÀY THEO GIỜ VIỆT NAM (UTC+7) ---
  const now = new Date();
  
  // 1. Giả lập giờ VN bằng cách cộng thêm 7 tiếng vào giờ UTC hiện tại
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  
  // 2. Reset về 00:00:00 đầu ngày (Lúc này đang là 00:00 của giờ VN)
  vnTime.setUTCHours(0, 0, 0, 0);
  
  // 3. Trừ lại 7 tiếng để ra thời điểm chính xác trong Database (Database lưu UTC)
  // (Ví dụ: 00:00 VN tương đương 17:00 hôm trước của UTC)
  const startOfDay = new Date(vnTime.getTime() - 7 * 60 * 60 * 1000);
  
  // 4. Thời điểm cuối ngày là 24h sau đó
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Lấy danh sách các bài đã đăng trong khoảng thời gian này
  const todayPosts = await db.select().from(posts).where(
    and(
      eq(posts.userId, userId),
      gte(posts.createdAt, startOfDay),
      lt(posts.createdAt, endOfDay)
    )
  );

  if (todayPosts.length >= 5) {
    return { error: `Hôm nay bạn đã đăng ${todayPosts.length}/5 bài. Hãy quay lại vào ngày mai nhé!` };
  }

  // Lưu bài viết vào Database
  try {
    await db.insert(posts).values({
      userId: userId,
      content: content || "",
      imageUrl: imageUrl, 
    });
    return { success: true };
  } catch (err) {
    return { error: "Lỗi hệ thống khi đăng bài." };
  }
}