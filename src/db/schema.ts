// src/db/schema.ts
import { pgTable, serial, date, boolean, timestamp, text, integer,json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  otp: text("otp"),
  otpExpires: timestamp("otp_expires"),
  
  // --- THAY ĐỔI 2 CỘT NÀY THÀNH MẢNG JSON ---
  avatarUrls: json("avatar_urls").$type<string[]>(), // Lưu lịch sử ảnh đại diện
  coverUrls: json("cover_urls").$type<string[]>(),   // Lưu lịch sử ảnh bìa
  
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
// src/db/schema.ts

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  
  // 1. CỘT DI SẢN: Map vào cột "images" cũ trong DB dưới dạng text để giữ 15 ảnh
  oldImage: text("images"), 
  
  // 2. CỘT MỚI: Tạo một cột hoàn toàn mới trong DB tên là "image_urls" dạng json
  images: json("image_urls").$type<string[]>(), 
  
  createdAt: timestamp("created_at").defaultNow(),
});
