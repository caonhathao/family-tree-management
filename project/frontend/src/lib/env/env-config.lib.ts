import { z } from "zod";

const envSchema = z.object({
  SERVER_DOMAIN: z.string().url("Invalid server domain"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  ACCESS_TOKEN_EXPIRES_IN: z.coerce.number().positive(),
  REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().positive(),
});

const envServer = envSchema.safeParse(process.env);

if (!envServer.success) {
  console.error("Invalid environment variables:", envServer.error.format());
  throw new Error("Invalid environment variables");
}

const envData = envServer.data;

export const EnvConfig = {
  serverDomain: envData.SERVER_DOMAIN,
  nodeValue: envData.NODE_ENV,
  accessTokenExpireIn: envData.ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpireIn: envData.REFRESH_TOKEN_EXPIRES_IN,
} as const;
