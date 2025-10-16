import api from "@/services/api";
import Cookies from "js-cookie";

const cookieExpiration = parseInt(process.env.NEXT_PUBLIC_COOKIE_EXPIRATION || "1", 10);

export const selectBranch = async (branchId?: number): Promise<string | null> => {
  try {
    const token = Cookies.get("token"); 
    if (!token) throw new Error("No token found");
    const { data } = await api.post(
      "/auth/select-branch",
      { branchId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.token) {
      Cookies.set("token", data.token, { 
        expires: cookieExpiration, 
        secure: window.location.protocol === "https:", 
        sameSite: "Strict" 
      });
      return data.token;
    }
  } catch (err) {
    console.error(err);
    throw new Error("Error selecting branch");
  }
  return null;
};
