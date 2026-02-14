"use client";

import { createPost } from "@/app/actions";
import { useState, useRef } from "react"; // Dùng useRef để reset input file
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PostForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Xử lý khi chọn ảnh để hiển thị Preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Tạo URL tạm thời để hiện ảnh ngay lập tức
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await createPost(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      (event.target as HTMLFormElement).reset();
      setPreviewUrl(null); // Xóa preview
      setIsLoading(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Hôm nay bạn có ảnh gì khoe không?
      </h3>
      
      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Input nhập Text */}
      <textarea
        name="content"
        rows={3}
        placeholder="Viết caption..."
        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm resize-none bg-gray-50 focus:bg-white transition"
      />

      {/* Khu vực hiển thị Preview ảnh */}
      {previewUrl && (
        <div className="mt-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
           {/* Nút xóa ảnh */}
           <button 
             type="button"
             onClick={() => {
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
             }}
             className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 z-10"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
           <Image 
             src={previewUrl} 
             alt="Preview" 
             fill 
             className="object-contain" // Hiển thị trọn vẹn ảnh
           />
        </div>
      )}

      {/* Thanh công cụ bên dưới */}
      <div className="mt-3 flex justify-between items-center">
        {/* Nút chọn ảnh */}
        <div className="flex items-center">
          <label 
            htmlFor="image-upload" 
            className="cursor-pointer flex items-center gap-2 text-gray-500 hover:text-blue-600 transition p-2 hover:bg-blue-50 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Thêm ảnh</span>
          </label>
          <input 
            id="image-upload" 
            name="image" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

        {/* Nút Đăng */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-6 py-2 rounded-full text-sm font-bold text-white shadow-sm transition-all
            ${isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"}
          `}
        >
          {isLoading ? "Đang tải lên..." : "Đăng bài"}
        </button>
      </div>
    </form>
  );
}