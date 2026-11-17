import axios from "axios";
import Cookies from "js-cookie";
import { getTenant } from "@/services/tenant";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://192.168.75.17:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Sin sesión (login, portal público) el backend necesita saber a qué empresa va la petición.
  const tenant = getTenant();
  if (tenant) {
    config.headers["X-Tenant"] = tenant;
  }
  return config;
});

export default api;
