import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning" | "default";

export const Toaster = ({
  title,
  description,
  type = "default",
  position = "top-right",
  duration,
  icon,
  cancel,
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
  duration?: number;
  icon?: React.ReactNode;
  cancel?: {
    label: string;
    onClick: () => void;
  };
}) => {
  const options = {
    description,
    position,
    duration,
    icon,
    cancel,
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
