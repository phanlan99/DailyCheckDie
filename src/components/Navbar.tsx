// src/components/Navbar.tsx
"use client"; // Chuyển thành Client Component để xử lý sự kiện click

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();
  
  // Tạm thời hardcode biến này để test giao diện. 
  // Sau này khi cài NextAuth, ta sẽ lấy từ session.
  const isLoggedIn = false; 
  const userName = "Nguyễn Văn A";

  const menuItems = [
    { name: 'Điểm danh', href: '/' }, // Trang chủ là trang điểm danh
    { name: 'Mục tiêu', href: '/goals' },
    { name: 'Dự án', href: '/projects' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <span className="text-3xl">🌱</span> GrowEveryDay
            </Link>
          </div>

          {/* Menu Chính */}
          <div className="hidden sm:flex sm:space-x-8 items-center">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                  ${pathname === item.href 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"}
                `}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Khu vực User (Đăng nhập/Đăng ký) */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              // Trạng thái ĐÃ ĐĂNG NHẬP
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Chào, {userName}
                </span>
                <button className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg transition">
                  Đăng xuất
                </button>
              </div>
            ) : (
              // Trạng thái CHƯA ĐĂNG NHẬP
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="text-sm font-medium text-gray-600 hover:text-blue-600 px-3 py-2">
                    Đăng nhập
                  </button>
                </Link>
                <Link href="/register">
                  <button className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition">
                    Đăng ký
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;