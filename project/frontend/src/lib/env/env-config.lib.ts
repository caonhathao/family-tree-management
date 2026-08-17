import { z } from "zod";

// 1. Schema này CHỈ dùng ở phía Server
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SITE_URL: z.string().nonempty({ message: "SITE_URL is required" }),
  BACKEND_API_URL: z
    .string()
    .url()
    .nonempty({ message: "BACKEND_API_URL is required" }),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z
    .string()
    .nonempty({ message: "NEXT_PUBLIC_GOOGLE_CLIENT_ID is required" }),
});

// Khởi tạo object dữ liệu mặc định rỗng
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let envData: any = {};

// 2. Tách biệt hoàn toàn logic bằng block kiểm tra môi trường nghiêm ngặt
if (typeof window === "undefined") {
  // NẾU LÀ SERVER: Chạy validate toàn bộ bằng Zod
  const envServer = serverSchema.safeParse(process.env);

  if (!envServer.success) {
    console.error(
      "Invalid Server environment variables:",
      envServer.error.format(),
    );
    throw new Error("Invalid Server environment variables");
  }
  envData = envServer.data;
} else {
  // NẾU LÀ CLIENT (TRÌNH DUYỆT): Không dùng Zod để tránh bị sập do chặn process.env
  // Chỉ kiểm tra trực tiếp biến public của Google bằng câu lệnh if thường
  const googleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!googleId) {
    console.error("Missing environment variable: NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  }
}

// 3. Export cấu hình ra ngoài sử dụng
export const EnvConfig = {
  nodeValue: envData.NODE_ENV || process.env.NODE_ENV || "development",
  siteUrl: envData.SITE_URL || process.env.SITE_URL,
  backendApiUrl: envData.BACKEND_API_URL || process.env.BACKEND_API_URL,

  // Biến này bắt buộc viết tường minh chuỗi process.env.NEXT_PUBLIC_... ở đây
  // để Next.js có thể inject giá trị vào client-side khi build.
  googleClientId:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    envData.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
} as const;
