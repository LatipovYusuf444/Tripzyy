import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
} from "@/types/auth"
import client from "../client"

export const login = (data: LoginPayload) =>
  client.post<AuthResponse>("/auth/login", data)

export const register = (data: RegisterPayload) =>
  client.post<RegisterResponse>("/auth/register", data)

export const logout = () => client.post("/auth/logout")
