export type AuthUser = {
  id: string;
  email: string | null;
  fullNameEn: string;
  tenantId: string | null;
  tenantSlug?: string | null;
  permissions: string[];
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
