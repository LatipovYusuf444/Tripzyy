export interface LoginPayload {
  email: string;
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
