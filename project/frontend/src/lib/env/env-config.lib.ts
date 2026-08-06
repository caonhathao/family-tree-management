import { z } from "zod";

// 1. Schema này CHỈ dùng ở phía Server
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().positive(),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().positive(),
  JWT_ACCESS_SECRET_KEY: z
    .string()
    .nonempty({ message: "JWT_ACCESS_SECRET_KEY is required" }),
  JWT_REFRESH_SECRET_KEY: z
    .string()
    .nonempty({ message: "JWT_REFRESH_SECRET_KEY is required" }),
  MAX_FILE_SIZE: z.coerce.number().positive(),
  FOLDER_ALBUM: z.string().nonempty({ message: "FOLDER_ALBUM is required" }),
  FOLDER_USER: z.string().nonempty({ message: "FOLDER_USER is required" }),
  FOLDER_BLOG: z.string().nonempty({ message: "FOLDER_BLOG is required" }),
  FOLDER_FAMILY: z.string().nonempty({ message: "FOLDER_FAMILY is required" }),
  CLOUDINARY_NAME: z
    .string()
    .nonempty({ message: "CLOUDINARY_NAME is required" }),
  CLOUDINARY_API_KEY: z
    .string()
    .nonempty({ message: "CLOUDINARY_API_KEY is required" }),
  CLOUDINARY_API_SECRET: z
    .string()
    .nonempty({ message: "CLOUDINARY_API_SECRET is required" }),
  CLOUDINARY_URL: z
    .string()
    .nonempty({ message: "CLOUDINARY_URL is required" }),
  CLIENT_DOMAIN: z
    .string()
    .url()
    .nonempty({ message: "CLIENT_DOMAIN is required" }),
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
  accessTokenExpireIn:
    envData.ACCESS_TOKEN_EXPIRES_IN ||
    Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  refreshTokenExpireIn:
    envData.REFRESH_TOKEN_EXPIRES_IN ||
    Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
  jwtAccessSecret:
    envData.JWT_ACCESS_SECRET_KEY || process.env.JWT_ACCESS_SECRET_KEY,
  jwtRefreshSecret:
    envData.JWT_REFRESH_SECRET_KEY || process.env.JWT_REFRESH_SECRET_KEY,
  maxFileSize: envData.MAX_FILE_SIZE || Number(process.env.MAX_FILE_SIZE),
  folderAlbum: envData.FOLDER_ALBUM || process.env.FOLDER_ALBUM,
  FolderBlog: envData.FOLDER_BLOG || process.env.FOLDER_BLOG,
  folderUser: envData.FOLDER_USER || process.env.FOLDER_USER,
  folderFamily: envData.FOLDER_FAMILY || process.env.FOLDER_FAMILY,
  cloudinaryName: envData.CLOUDINARY_NAME || process.env.CLOUDINARY_NAME,
  cloudinaryApiKey:
    envData.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret:
    envData.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
  cloudinaryUrl: envData.CLOUDINARY_URL || process.env.CLOUDINARY_URL,
  clientDomain: envData.CLIENT_DOMAIN || process.env.CLIENT_DOMAIN,
  siteUrl: envData.SITE_URL || process.env.SITE_URL,
  backendApiUrl: envData.BACKEND_API_URL || process.env.BACKEND_API_URL,

  // Biến này bắt buộc viết tường minh chuỗi process.env.NEXT_PUBLIC_... ở đây
  // để Next.js có thể inject giá trị vào client-side khi build.
  googleClientId:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    envData.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
} as const;
