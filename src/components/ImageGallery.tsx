"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface ImageGalleryProps {
  images: any;
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // --- 1. LỌC BỎ CÁC LINK LỖI ---
  // Chỉ giữ lại những phần tử là chuỗi (string) và bắt đầu bằng "http" (link hợp lệ)
  const validImages = Array.isArray(images) 
    ? images.filter((url: any) => typeof url === 'string' && url.trim().startsWith('http'))
    : [];

  // --- 2. KIỂM TRA LẠI ---
  // Nếu sau khi lọc xong mà không có ảnh nào hợp lệ thì không render gì cả
  if (validImages.length === 0) {
    return null;
  }

  // Chuyển đổi mảng hợp lệ sang slides
  const slides = validImages.map((url: string) => ({ src: url }));

  const handleOpenLightbox = (index: number) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  return (
    <>
      <div
        className={`
          mt-3 w-full grid gap-2 rounded-xl overflow-hidden
          ${validImages.length === 1 ? "grid-cols-1" : "grid-cols-2"} 
        `}
      >
        {/* NHỚ SỬA images.map THÀNH validImages.map NHÉ */}
        {validImages.map((imgUrl: string, index: number) => (
          <div
            key={index}
            className="relative w-full h-full cursor-pointer group rounded-lg overflow-hidden border-2 border-blue-200/80"
            onClick={() => handleOpenLightbox(index)}
          >
            <Image
              src={imgUrl}
              alt={`Gallery image ${index + 1}`}
              width={0}
              height={0}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ width: "100%", height: "auto", objectFit: "cover" }}
              className="group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"></div>
          </div>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={currentIndex}
        slides={slides}
        controller={{ closeOnBackdropClick: true }}
        styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
      />
    </>
  );
}