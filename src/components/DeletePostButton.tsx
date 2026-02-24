"use client";

import { useState } from "react";
import { deletePost } from "@/app/post-actions";
import { useRouter } from "next/navigation";

export default function DeletePostButton({ postId }: { postId: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // Hỏi lại cho chắc chắn
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
      return;
    }

    setIsDeleting(true);
    const result = await deletePost(postId);

    if (result?.error) {
      alert(result.error);
      setIsDeleting(false);
    } else {
      // Xóa thành công thì load lại dữ liệu mới nhất
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
        isDeleting 
          ? "text-gray-400 cursor-not-allowed" 
          : "text-red-500 hover:text-red-700 hover:bg-red-50"
      }`}
    >
      {isDeleting ? "Đang xóa..." : "Xóa bài"}
    </button>
  );
}