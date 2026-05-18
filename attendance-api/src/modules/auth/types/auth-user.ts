export type AuthUser = {
  id: string;
  email: string | null;
  fullNameEn: string;
  permissions: string[];
};

export type AccessTokenPayload = {
  sub: string;
  email: string | null;
  permissions: string[];
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
};
