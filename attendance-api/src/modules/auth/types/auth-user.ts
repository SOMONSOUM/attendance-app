export type AuthUser = {
  id: string;
  tenantId: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
  email: string | null;
  fullNameEn: string;
  permissions: string[];
};

export type AccessTokenPayload = {
  sub: string;
  tenantId: string | null;
  email: string | null;
  permissions: string[];
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
};
