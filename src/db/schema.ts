// src/db/schema.ts
import { pgTable, serial, date, boolean, timestamp, text, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Tên đăng nhập (Bắt buộc & Duy nhất)
  password: text("password").notNull(),          // Mật khẩu (Lưu nguyên văn)
  email: text("email"),                          // Email (Không bắt buộc - Optional)
  createdAt: timestamp("created_at").defaultNow(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  isPresent: boolean("is_present").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
