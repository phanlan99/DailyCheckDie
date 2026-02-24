// src/db/schema.ts
import { pgTable, serial, date, boolean, timestamp, text, integer,json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Tên đăng nhập (Bắt buộc & Duy nhất)
  password: text("password").notNull(),          // Mật khẩu (Lưu nguyên văn)
  email: text("email"),
  // --- THÊM 2 CỘT NÀY ---
  otp: text("otp"), // Lưu mã 6 số
  otpExpires: timestamp("otp_expires"),                          // Email (Không bắt buộc - Optional)
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  isPresent: boolean("is_present").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// src/db/schema.ts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  
  // --- THAY ĐỔI Ở ĐÂY ---
  // Lưu mảng các đường dẫn ảnh. Ví dụ: ["https://...", "https://..."]
  images: json("images").$type<string[]>(), 
  
  createdAt: timestamp("created_at").defaultNow(),
});
