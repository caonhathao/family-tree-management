export const EnvConfig = {
  serverDomain: process.env.SERVER_DOMAIN,
  nodeValue: process.env.NODE_ENV,
  accessTokenExpireIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
  refreshToeknExpireIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
};
