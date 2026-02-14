// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',      // Nơi lưu các file migration
  schema: './src/db/schema.ts', // Đường dẫn tới file schema vừa tạo
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});