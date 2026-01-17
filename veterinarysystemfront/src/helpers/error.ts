import axios from "axios";

export function getAaxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Error de red o servidor";
  }

  if (error instanceof Error) return error.message;

  return typeof error === "string" ? error : "Error desconocido";
}
