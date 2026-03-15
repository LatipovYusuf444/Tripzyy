export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  status: "success" | "error";
  message: string;
  data: {
    token: string;
    currency: string;
  };
}

export interface RegisterResponse {
  id: number | string;
  full_name: string;
  email: string;
  access?: string;
  refresh?: string;
}
