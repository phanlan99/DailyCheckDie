"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCloudinarySignature, updateUserProfileImages } from "@/app/actions";

interface ProfileProps {
  username: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  postCount: number;
}

export default function EditableProfileHeader({ username, avatarUrl, coverUrl, postCount }: ProfileProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  // Hàm xử lý upload chung cho cả Avatar và Cover
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Lấy chữ ký Cloudinary
      const { signature, timestamp, folder, apiKey, cloudName } = await getCloudinarySignature();

      // 2. Upload ảnh
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
      const data = await response.json();
      const newImageUrl = data.secure_url;

      // 3. Cập nhật Database
      if (type === 'avatar') {
        await updateUserProfileImages(newImageUrl, undefined);
      } else {
        await updateUserProfileImages(undefined, newImageUrl);
      }

      router.refresh(); // Load lại trang để hiện ảnh mới
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tải ảnh lên!");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm mb-8 border border-gray-100 overflow-hidden relative">
      {/* Nút báo đang tải */}
      {isUploading && (
        <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
            Đang cập nhật ảnh...
          </span>
        </div>
      )}

      {/* --- ẢNH BÌA (COVER) --- */}
      <div className="relative w-full h-48 bg-gray-200 group">
        {coverUrl ? (
          <Image src={coverUrl} alt="Cover" fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-300 to-indigo-400"></div>
        )}
        
        {/* NÚT ẢNH BÌA: Thêm z-10 và tách input ra ngoài */}
        <label 
          htmlFor="cover-upload"
          className="absolute bottom-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition flex items-center gap-2 shadow-sm border border-white/20"
        >
          <span>📷 <span className="hidden sm:inline">Sửa ảnh bìa</span></span>
        </label>
        <input 
          id="cover-upload" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={(e) => handleUpload(e, 'cover')} 
          disabled={isUploading} 
        />
      </div>

      {/* --- PHẦN THÔNG TIN & AVATAR --- */}
      <div className="px-6 pb-6 relative">
        <div className="relative -mt-12 mb-4 w-24 h-24 mx-auto sm:mx-0 sm:ml-4">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold shadow-md overflow-hidden relative">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              username.charAt(0).toUpperCase()
            )}
            
            {/* NÚT AVATAR: Thêm z-10 và tách input ra ngoài */}
            <label 
              htmlFor="avatar-upload"
              className="absolute bottom-0 left-0 right-0 z-10 bg-black/50 text-white py-1 text-center cursor-pointer hover:bg-black/70 transition"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">📷 Thay</span>
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleUpload(e, 'avatar')} 
              disabled={isUploading} 
            />
          </div>
        </div>

        {/* Tên và Thống kê */}
        <div className="text-center sm:text-left sm:ml-4">
          <h1 className="text-2xl font-bold text-gray-900">{username}</h1>
          <p className="text-gray-500 mt-1">Đã đăng {postCount} bài viết</p>
        </div>
      </div>
    </div>
  );
}