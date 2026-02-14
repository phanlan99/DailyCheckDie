// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/app/actions';

// Thêm username vào interface Props
interface NavbarProps {
  userId?: string;
  username?: string; // Thêm dòng này
}

const Navbar = ({ userId, username }: NavbarProps) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Điểm danh', href: '/' },
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

          {/* Khu vực User */}
          <div className="flex items-center space-x-4">
            {userId ? (
              // Trạng thái ĐÃ ĐĂNG NHẬP
              <div className="flex items-center gap-3">
                {/* Hiển thị Avatar giả lập + Tên User */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
                        {username ? username.charAt(0).toUpperCase() : "U"}
                    </div>
                    <span className="text-sm font-bold text-gray-700 hidden sm:block">
                    {username}
                    </span>
                </div>

                <div className="h-4 w-[1px] bg-gray-300 mx-1"></div> {/* Đường gạch ngăn cách */}

                <button 
                  onClick={() => logoutUser()} 
                  className="text-sm text-red-500 hover:text-red-700 font-medium px-2 py-2 transition"
                >
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