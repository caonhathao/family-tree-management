export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export type JwtRequest = {
  payload: JwtPayload;
};
