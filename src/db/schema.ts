// src/db/schema.ts
import { pgTable, serial, date, boolean, timestamp, text, integer } from "drizzle-orm/pg-core";

// 1. Tạo bảng Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Lưu mật khẩu đã mã hóa
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Cập nhật bảng Attendance (Thêm cột userId)
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Liên kết với bảng users
  date: date("date").notNull(), 
  isPresent: boolean("is_present").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});