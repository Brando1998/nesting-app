export type Role = 'admin' | 'client';

// src/types/User.ts

export interface User {
  id?: string;             // UUID
  username?: string;
  email?: string;
  balance?: number;        // Decimal en TS lo manejamos como number
  is_admin?: boolean;
  password?: string;
  // Campos de perfil opcionales
  full_name?: string | null;
  phone?: string | null;
  company_name?: string | null;
}
