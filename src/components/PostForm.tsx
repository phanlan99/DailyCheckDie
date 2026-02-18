"use client";

import { createPost, getCloudinarySignature } from "@/app/actions"; // Import thêm hàm lấy chữ ký
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PostForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // State lưu file thật để upload

  // Xử lý khi chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Lưu file vào state
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    
    let uploadedImageUrl = "";

    // --- BƯỚC 1: UPLOAD ẢNH LÊN CLOUDINARY (CLIENT-SIDE) ---
    if (selectedFile) {
      try {
        // 1. Xin chữ ký bảo mật từ Server
        const { signature, timestamp, folder, apiKey, cloudName } = await getCloudinarySignature();

        // 2. Chuẩn bị dữ liệu gửi lên Cloudinary
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        uploadData.append('api_key', apiKey!);
        uploadData.append('timestamp', timestamp.toString());
        uploadData.append('signature', signature);
        uploadData.append('folder', folder);

        // 3. Gọi API Cloudinary trực tiếp từ trình duyệt
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: uploadData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Upload failed");
        }

        uploadedImageUrl = data.secure_url; // Lấy được Link ảnh HTTPS
        
      } catch (err) {
        console.error(err);
        setError("Lỗi khi tải ảnh lên Cloudinary. Vui lòng thử lại.");
        setIsLoading(false);
        return; // Dừng lại nếu upload lỗi
      }
    }

    // --- BƯỚC 2: GỬI LINK ẢNH VÀ NỘI DUNG VỀ SERVER ---
    
    // Xóa file ảnh gốc khỏi formData gửi về server (để server không phải nhận file nặng)
    formData.delete('image'); 
    
    // Thêm link ảnh vừa có được vào formData
    if (uploadedImageUrl) {
        formData.append('imageUrl', uploadedImageUrl);
    }

    // Gọi Server Action để lưu bài viết
    const result = await createPost(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      formElement.reset();
      setPreviewUrl(null);
      setSelectedFile(null);
      setIsLoading(false);
      router.refresh(); // Làm mới trang để hiện bài mới
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Hôm nay bạn có ảnh gì khoe không? (HD & 4K thoải mái)
      </h3>
      
      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          ⚠️ {error}
        </div>
      )}

      <textarea
        name="content"
        rows={3}
        placeholder="Viết caption..."
        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 text-sm resize-none bg-gray-50 focus:bg-white transition"
      />

      {/* Preview Ảnh */}
      {previewUrl && (
        <div className="mt-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
           <button 
             type="button"
             onClick={() => {
                setPreviewUrl(null);
                setSelectedFile(null);
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
             className="object-contain"
           />
        </div>
      )}

      <div className="mt-3 flex justify-between items-center">
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
          {/* Input file vẫn cần thiết để chọn ảnh, nhưng name="image" sẽ bị xóa trước khi gửi về server */}
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

        <button
          type="submit"
          disabled={isLoading}
          className={`
            px-6 py-2 rounded-full text-sm font-bold text-white shadow-sm transition-all
            ${isLoading ? "bg-gray-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700 hover:shadow-md"}
          `}
        >
          {isLoading ? "Đang xử lý..." : "Đăng bài"}
        </button>
      </div>
    </form>
  );
}