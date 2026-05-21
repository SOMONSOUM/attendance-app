export type TenantUser = {
  id: string;
  email: string | null;
  fullNameEn: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  ownerUser?: TenantUser | null;
  users?: TenantUser[];
  _count?: { users: number; events: number };
};

export type ViewKey = "overview" | "tenants" | "create" | "owners" | "settings";
export type Locale = "en" | "km";
