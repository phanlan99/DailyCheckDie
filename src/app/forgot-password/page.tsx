"use client";

import { useState } from "react";
import { sendOtp, resetPasswordWithOtp } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // <-- Thêm state lưu Username
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Xử lý Gửi Email (Bước 1)
  async function handleSendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    
    // Gọi Server Action (Lúc này action trả về username nữa)
    const result = await sendOtp(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      // Lưu lại thông tin để dùng cho Bước 2
      setEmail(result.email as string);
      setUsername(result.username as string); // <-- Lưu Username
      
      setStep(2);
      setIsLoading(false);
    }
  }

  // Xử lý Đổi Mật Khẩu (Bước 2) - Giữ nguyên logic
  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append('email', email); 

    const result = await resetPasswordWithOtp(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      alert(`Đổi mật khẩu thành công! Hãy đăng nhập với user: ${username}`);
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {step === 1 ? "Quên mật khẩu?" : "Đặt lại mật khẩu"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 1 
              ? "Nhập email để tìm lại tài khoản" 
              : "Kiểm tra email để lấy mã xác thực"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {/* --- FORM BƯỚC 1 --- */}
        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Nhập địa chỉ Email của bạn"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? "Đang tìm kiếm..." : "Tiếp tục"}
            </button>
          </form>
        )}

        {/* --- FORM BƯỚC 2 (HIỂN THỊ USERNAME) --- */}
        {step === 2 && (
          <form className="mt-6 space-y-6" onSubmit={handleResetPassword}>
            
            {/* THÔNG BÁO TÌM THẤY USER */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
              <p className="text-sm text-blue-600 mb-1">Tìm thấy tài khoản của bạn:</p>
              <p className="text-2xl font-bold text-blue-800 tracking-wide">
                {username}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Hãy ghi nhớ Tên đăng nhập này nhé!
              </p>
            </div>

            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP (6 số)</label>
                <input
                  name="otp"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm tracking-widest text-center font-bold text-lg"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  name="newPassword"
                  type="password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận & Đổi mật khẩu"}
            </button>
            
            <div className="text-center mt-2">
               <button 
                 type="button" 
                 onClick={() => setStep(1)}
                 className="text-sm text-gray-500 hover:text-gray-700 underline"
               >
                 Không phải tài khoản này? Nhập lại email.
               </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4 border-t pt-4">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}