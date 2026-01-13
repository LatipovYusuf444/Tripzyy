import { http } from "@/shared/api/http";

export type RegisterPayload = {
  full_name: string;
  email: string;
  phone?: string; // ✅ MUHIM: optional qilindi
  password: string;
};

export type RegisterResponse = {
  id: number | string;
  full_name: string;
  email: string;
  access?: string;
  refresh?: string;
};

export async function registerUser(payload: RegisterPayload) {
  // ✅ BACKEND ULANADIGAN JOY:
  // POST /auth/register/  (sizda endpoint boshqacha bo'lsa shu yerini o'zgartirasiz)
  const { data } = await http.post<RegisterResponse>("/auth/register/", payload);
  return data;
}
