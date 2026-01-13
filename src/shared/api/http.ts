import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.Vite_API_URL || "http://localhost:8000/api",
  withCredentials: true, //agar cookie/session ishlatsangiz true qolsin
  headers: {
    "Content-Type": "application/json",
  },
});


// Token ishlatsangiz (JWT) — comment:
// http.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
