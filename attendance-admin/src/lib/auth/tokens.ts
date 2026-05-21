export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  tenantId?: string | null;
  tenantSlug?: string | null;
  tenantName?: string | null;
  email: string | null;
  fullNameEn: string;
  permissions: string[];
};

export type AuthSession = AuthTokens & {
  user: AuthUser;
};
