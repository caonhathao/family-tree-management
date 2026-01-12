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
});
