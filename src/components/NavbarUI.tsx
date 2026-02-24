// src/components/NavbarUI.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname } from 'next/navigation';
import { logoutUser } from '@/app/actions';
import { useState } from 'react';

export interface NavbarUIProps {
  userId?: string;
  username?: string;
  avatarUrl?: string | null; 
}

export default function NavbarUI({ userId, username, avatarUrl }: NavbarUIProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Điểm danh', href: '/' },
    { name: 'Xếp hạng', href: '/rank' },
    { name: 'Bảng tin', href: '/feed' },
    { name: 'Cá nhân', href: '/my-posts' },
    
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* --- LOGO & HAMBURGER (BÊN TRÁI/GIỮA) --- */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">🌱</span> GrowEveryDay
              </Link>
            </div>

            {/* Menu Desktop */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200
                    ${pathname === item.href 
                      ? "border-blue-500 text-gray-900" 
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"}
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* --- KHU VỰC USER & NÚT MOBILE (BÊN PHẢI) --- */}
          <div className="flex items-center">
            {/* User Info (Luôn hiện) */}
            <div className="flex items-center space-x-4">
              {userId ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  
                  {/* --- HIỂN THỊ AVATAR TRÊN DESKTOP --- */}
                  <Link href={`/user/${userId}`} className="flex items-center gap-2 hover:opacity-80 transition">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative border border-gray-200 bg-blue-100 flex items-center justify-center shadow-sm">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <span className="text-blue-600 font-bold text-xs">
                          {username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700 hidden sm:block">
                      {username}
                    </span>
                  </Link>
                  
                  <div className="hidden sm:block h-4 w-[1px] bg-gray-300 mx-1"></div>
                  
                  {/* Nút Đăng xuất (Desktop) */}
                  <button 
                    onClick={() => logoutUser()} 
                    className="hidden sm:block text-sm text-red-500 hover:text-red-700 font-medium px-2 py-2 transition"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
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

            {/* Nút Hamburger (Chỉ hiện trên Mobile) */}
            <div className="-mr-2 flex items-center sm:hidden ml-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MENU MOBILE (Sổ xuống khi bấm nút) --- */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full z-40">
          <div className="pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors
                  ${pathname === item.href
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"}
                `}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Phần User Action trên Mobile */}
            <div className="border-t border-gray-200 pt-4 pb-3">
              {userId ? (
                <div className="px-4 flex items-center justify-between">
                   <div className="flex items-center">
                      
                      {/* --- HIỂN THỊ AVATAR TRÊN MOBILE --- */}
                      <Link href={`/user/${userId}`} onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="flex-shrink-0 relative w-10 h-10 rounded-full overflow-hidden border border-blue-200 bg-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">
                           {avatarUrl ? (
                              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                           ) : (
                              username ? username.charAt(0).toUpperCase() : "U"
                           )}
                        </div>
                      </Link>
                      
                      <div className="ml-3">
                        <Link href={`/user/${userId}`} onClick={() => setIsMobileMenuOpen(false)}>
                          <div className="text-base font-medium text-gray-800 hover:text-blue-600 transition">{username}</div>
                        </Link>
                        <div className="text-sm font-medium text-gray-500">Thành viên</div>
                      </div>
                   </div>
                   <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logoutUser();
                      }}
                      className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md font-medium"
                   >
                      Đăng xuất
                   </button>
                </div>
              ) : (
                <div className="px-4 space-y-2">
                   <Link 
                      href="/login" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                   >
                      Đăng nhập
                   </Link>
                   <Link 
                      href="/register" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full text-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                   >
                      Đăng ký
                   </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}