import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning" | "default";

export const Toaster = ({
  title,
  description,
  type = "default",
  position = "top-right",
}: {
  title: string;
  description: string;
  type?: ToastType;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
}) => {
  const options = {
    description,
    position,
  };

  switch (type) {
    case "success":
      return toast.success(title, options);
    case "error":
      return toast.error(title, options);
    case "info":
      return toast.info(title, options);
    case "warning":
      return toast.warning(title, options);
    default:
      return toast(title, options);
  }
};
