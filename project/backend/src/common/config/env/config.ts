export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET_KEY,
    refreshSecret: process.env.JWT_REFRESH_SECRET_KEY,
    accessExpires: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
    refreshExpires: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
  },
  maxFileSize: Number(process.env.MAX_FILE_SIZE),
  cloudinary: {
    folderAlbum: process.env.FOLDER_ALBUM,
    folderUser: process.env.FOLDER_USER,
    folderFamily: process.env.FOLDER_FAMILY,
    cloudName: process.env.CLOUDINARY_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    url: process.env.CLOUDINARY_URL,
  },
  domain: {
    clientDomain: process.env.CLIENT_DOMAIN,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.MAIL_FROM ?? 'Family Management <onboarding@resend.dev>',
  },
});
