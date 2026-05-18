export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id: string;
  email: string | null;
  fullNameEn: string;
  permissions: string[];
};

export type AuthSession = AuthTokens & {
  user: AuthUser;
};
