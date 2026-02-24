"use client";

import { createPost, getCloudinarySignature } from "@/app/actions";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PostForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State quản lý danh sách file và danh sách preview (Dạng mảng)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Xử lý khi chọn ảnh (Hỗ trợ chọn nhiều)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Chuyển FileList thành Array
      const newFiles = Array.from(e.target.files);
      
      // Giới hạn: Tối đa 4 ảnh 1 lần đăng cho đẹp
      if (newFiles.length + selectedFiles.length > 4) {
        alert("Chỉ được chọn tối đa 4 ảnh thôi nhé!");
        // Reset input file để người dùng chọn lại
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Tạo Preview URL cho từng file
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));

      setSelectedFiles(prev => [...prev, ...newFiles]); // Cộng dồn file cũ
      setPreviewUrls(prev => [...prev, ...newPreviews]); // Cộng dồn preview cũ
      
      // Reset input value để có thể chọn lại cùng một file nếu vừa xóa
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Hàm xóa 1 ảnh khỏi danh sách chọn
  const removeImage = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewUrls];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    
    const uploadedImageUrls: string[] = [];

    // --- BƯỚC 1: UPLOAD TẤT CẢ ẢNH SONG SONG LÊN CLOUDINARY ---
    if (selectedFiles.length > 0) {
      try {
        // Xin chữ ký 1 lần dùng cho tất cả các file trong đợt upload này
        const { signature, timestamp, folder, apiKey, cloudName } = await getCloudinarySignature();

        // Tạo mảng các Promise upload (Chạy song song)
        const uploadPromises = selectedFiles.map(async (file) => {
          const uploadData = new FormData();
          uploadData.append('file', file);
          uploadData.append('api_key', apiKey!);
          uploadData.append('timestamp', timestamp.toString());
          uploadData.append('signature', signature);
          uploadData.append('folder', folder);

          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: uploadData,
          });
          
          if (!response.ok) throw new Error("Upload failed");
          return response.json();
        });

        // Chờ tất cả upload xong
        const results = await Promise.all(uploadPromises);
        
        // Lấy link ảnh từ kết quả
        results.forEach((res: any) => uploadedImageUrls.push(res.secure_url));

      } catch (err) {
        console.error(err);
        setError("Lỗi khi tải ảnh lên Cloudinary. Vui lòng thử lại.");
        setIsLoading(false);
        return;
      }
    }

    // --- BƯỚC 2: GỬI MẢNG LINK VỀ SERVER ---
    formData.delete('image'); // Xóa file gốc
    
    // Chuyển mảng link thành chuỗi JSON để gửi
    formData.append('images', JSON.stringify(uploadedImageUrls));

    // Gọi Server Action
    const result = await createPost(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result?.success) {
      formElement.reset();
      setPreviewUrls([]);
      setSelectedFiles([]);
      setIsLoading(false);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Chia sẻ khoảnh khắc (Tối đa 4 ảnh)
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

      {/* --- GRID HIỂN THỊ PREVIEW --- */}
      {previewUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
              <Image 
                src={url} 
                alt="Preview" 
                fill 
                className="object-cover" 
              />
              {/* Nút xóa ảnh */}
              <button 
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
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
          {/* QUAN TRỌNG: Thêm 'multiple' để chọn nhiều ảnh */}
          <input 
            id="image-upload" 
            name="image" 
            type="file" 
            accept="image/*" 
            multiple 
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