// src/app/actions.ts
'use server';

import { db } from '@/db';
import { attendance } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function toggleAliveStatus(dateString: string) {
  // 1. Kiểm tra xem ngày gửi lên có phải là "Hôm nay" không
  const today = new Date().toISOString().split('T')[0]; // Lấy YYYY-MM-DD hiện tại
  
  if (dateString !== today) {
    throw new Error("Không thể điểm danh cho quá khứ hoặc tương lai!");
  }

  // 2. Kiểm tra xem ngày này đã có trong DB chưa
  const existingRecord = await db.select().from(attendance).where(eq(attendance.date, dateString));

  if (existingRecord.length > 0) {
    // Nếu đã có (đang "Còn sống") -> Xóa đi (thành "Mất tích" - nếu bạn muốn cho phép hủy)
    // Hoặc giữ nguyên nếu bạn muốn "Bút sa gà chết". 
    // Ở đây tôi làm logic toggle (bật/tắt) cho linh hoạt.
    await db.delete(attendance).where(eq(attendance.date, dateString));
    return { status: "missing" };
  } else {
    // Nếu chưa có -> Thêm vào ("Còn sống")
    await db.insert(attendance).values({
      date: dateString,
      isPresent: true,
    });
    return { status: "alive" };
  }
}

// Hàm lấy danh sách các ngày đã "Sống sót" trong tháng
export async function getMonthlySurvival(month: number, year: number) {
  // Logic lấy dữ liệu từ DB (tạm thời lấy tất cả để đơn giản hóa demo)
  const records = await db.select().from(attendance);
  // Trả về mảng các chuỗi ngày: ['2023-10-01', '2023-10-02']
  return records.map(r => r.date); 
}