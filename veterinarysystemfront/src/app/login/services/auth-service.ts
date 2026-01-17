import api from "@/services/api";
import { LoginResponse } from "../types/auth";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { getAaxiosErrorMessage } from "@/helpers/error";

const cookieExpiration = parseInt(process.env.NEXT_PUBLIC_COOKIE_EXPIRATION || "1", 10);

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const { data }: { data: LoginResponse } = await api.post("/auth/login", { username, password });

    if (!data.token) throw new Error("No token received");

    Cookies.set("token", data.token, {
      expires: cookieExpiration,
      secure: window.location.protocol === "https:",
      sameSite: "Strict",
    });

    return data;
  } catch (error: unknown) {
    throw new Error(getAaxiosErrorMessage(error) || "Invalid credentials");
  }
};

export const useLogout = () => {
  const router = useRouter();

  return () => {
    Cookies.remove("token");
    router.push("/login");
  };
};
