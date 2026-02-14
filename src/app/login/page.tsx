"use client";

import { useState } from "react";
import { loginUser, registerUser } from "@/app/actions";

export default function AuthPage() {
  // State để chuyển đổi giữa Login và Register
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    // Gọi hàm tương ứng dựa trên chế độ đang chọn
    const result = isRegistering 
      ? await registerUser(formData) 
      : await loginUser(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
    // Nếu thành công, Server Action sẽ tự redirect, không cần làm gì thêm
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100 transition-all duration-300">
        
        {/* Header chuyển đổi */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isRegistering ? "Đăng ký thành viên" : "Chào mừng trở lại"}
          </h2>
          <p className="text-sm text-gray-600">
            {isRegistering 
              ? "Tham gia để theo dõi hành trình mỗi ngày" 
              : "Đăng nhập để điểm danh hôm nay"}
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tên đăng nhập"
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                // Xử lý bo góc nếu không có email
                style={!isRegistering ? { borderBottomLeftRadius: '0.375rem', borderBottomRightRadius: '0.375rem' } : {}}
                placeholder="Mật khẩu"
              />
            </div>
            
            {/* Chỉ hiện ô Email khi đang Đăng ký */}
            {isRegistering && (
              <div>
                <input
                  name="email"
                  type="email"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email (Không bắt buộc)"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
              isLoading ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isLoading ? "Đang xử lý..." : (isRegistering ? "Đăng ký ngay" : "Đăng nhập")}
          </button>
        </form>

        {/* Nút chuyển đổi chế độ */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {isRegistering ? "Đã có tài khoản? " : "Chưa có tài khoản? "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null); // Xóa lỗi cũ khi chuyển
              }}
              className="font-medium text-blue-600 hover:text-blue-500 underline focus:outline-none"
            >
              {isRegistering ? "Đăng nhập ngay" : "Đăng ký ngay"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}