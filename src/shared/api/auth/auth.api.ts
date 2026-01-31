import type { AuthResponse, LoginPayload } from "@/types/auth";
import client from "../client";


export const login = (data: LoginPayload) =>
  client.post<AuthResponse>("/auth/login", data);

export const logout = () =>
  client.post("/auth/logout");
