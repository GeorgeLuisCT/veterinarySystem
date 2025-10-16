import { cookies } from "next/headers";

export async function getUserInfo() {
  const cookieStore = cookies(); 
  const token = (await cookieStore).get("token")?.value; 

  if (!token) {
    throw new Error("Unauthorized: No token found");
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/info`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // 🔥 Envía el token en la cabecera
    },
    cache: "no-store", // Evita que Next.js use datos en caché
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user info: ${res.status}`);
  }

  return res.json();
}
