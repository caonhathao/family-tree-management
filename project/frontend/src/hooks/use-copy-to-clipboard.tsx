import { Toaster } from "@/components/shared/toast";
import { useCallback } from "react";
import { FaCheck } from "react-icons/fa";
import { IoMdCloseCircle } from "react-icons/io";

export const useCopyToClipboard = () => {
  const copy = useCallback(async (value: string) => {
    if (!value) {
      Toaster({
        title: "Hành động thất bại",
        description: "Không có dữ liệu để sao chép",
        duration: 3000,
        icon: <IoMdCloseCircle />,
        cancel: {
          label: "OK",
          onClick: () => {},
        },
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(value);

      Toaster({
        title: "Hành động thành công",
        description: "Đã sao chép vào bộ nhớ tạm",
        duration: 3000,
        icon: <FaCheck />,
        cancel: { label: "OK", onClick: () => {} },
      });
      return true;
    } catch (err) {
      Toaster({
        title: "Hành động thất bại",
        description: "Không thể sao chép vào bộ nhớ tạm",
        duration: 3000,
        icon: <IoMdCloseCircle />,
        cancel: { label: "OK", onClick: () => {} },
      });
      console.error("Failed to copy: ", err);
      return false;
    }
  }, []);

  return copy;
};
