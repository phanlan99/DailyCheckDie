// src/app/post-actions.ts
'use server';

import { db } from '@/db';
import { posts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

// --- HÀM XÓA BÀI VIẾT ---
export async function deletePost(postId: number) {
  // 1. Kiểm tra đăng nhập
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get('userId');
  if (!userIdCookie) return { error: "Bạn cần đăng nhập!" };
  
  const currentUserId = parseInt(userIdCookie.value);

  // 2. Kiểm tra xem bài viết có tồn tại và CÓ PHẢI CỦA USER NÀY không
  const existingPost = await db.select().from(posts).where(
    and(
      eq(posts.id, postId),
      eq(posts.userId, currentUserId) // Chỉ chủ bài viết mới được xóa
    )
  );

  if (existingPost.length === 0) {
    return { error: "Không tìm thấy bài viết hoặc bạn không có quyền xóa!" };
  }

  // 3. Tiến hành xóa
  try {
    await db.delete(posts).where(eq(posts.id, postId));
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Lỗi hệ thống khi xóa bài." };
  }
}