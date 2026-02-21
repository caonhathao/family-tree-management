import { z } from "zod";

const envSchema = z.object({
  // NEXT_PUBLIC_SERVER_DOMAIN: z.string().url("Invalid server domain"),
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
  GOOGLE_CLIENT_ID: z
    .string()
    .nonempty({ message: "GOOGLE_CLIENT_ID is required" }),
});

const envServer = envSchema.safeParse(process.env);

if (!envServer.success) {
  console.error("Invalid environment variables:", envServer.error.format());
  throw new Error("Invalid environment variables");
}

const envData = envServer.data;

export const EnvConfig = {
  // serverDomain: envData.NEXT_PUBLIC_SERVER_DOMAIN,
  nodeValue: envData.NODE_ENV,
  accessTokenExpireIn: envData.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpireIn: envData.REFRESH_TOKEN_EXPIRES_IN,
  jwtAccessSecret: envData.JWT_ACCESS_SECRET_KEY,
  jwtRefreshSecret: envData.JWT_REFRESH_SECRET_KEY,
  maxFileSize: envData.MAX_FILE_SIZE,
  folderAlbum: envData.FOLDER_ALBUM,
  FolderBlog: envData.FOLDER_BLOG,
  folderUser: envData.FOLDER_USER,
  folderFamily: envData.FOLDER_FAMILY,
  cloudinaryName: envData.CLOUDINARY_NAME,
  cloudinaryApiKey: envData.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: envData.CLOUDINARY_API_SECRET,
  cloudinaryUrl: envData.CLOUDINARY_URL,
  clientDomain: envData.CLIENT_DOMAIN,
  googleClientId: envData.GOOGLE_CLIENT_ID,
} as const;
