export type JwtPayload = {
  sub: string;
  email: string;
};

export type JwtRequest = {
  payload: JwtPayload;
};
