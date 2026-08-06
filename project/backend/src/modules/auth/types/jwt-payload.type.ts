export type JwtPayload = {
  id: string;
  role: string;
};

export type JwtRequest = {
  payload: JwtPayload;
};
