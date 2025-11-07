import { AxiosError } from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function parseErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const apiMessage = error.response?.data?.message;
        if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
            return apiMessage;
        }
        if (typeof error.message === "string") {
            return error.message;
        }
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "Ocurrió un error inesperado. Inténtalo nuevamente.";
}

export function formatDate(value?: string | null, pattern = "dd 'de' MMMM yyyy"): string {
    if (!value) {
        return "Sin registrar";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return format(date, pattern, { locale: es });
}

export function formatDateTime(value?: string | null): string {
    return formatDate(value, "dd 'de' MMMM yyyy, HH:mm 'h'");
}

export function buildLocalDateTime(date: string, time: string): string {
    const composed = `${date}T${time}`;
    const check = new Date(composed);
    if (Number.isNaN(check.getTime())) {
        return composed;
    }
    const year = check.getFullYear();
    const month = `${check.getMonth() + 1}`.padStart(2, "0");
    const day = `${check.getDate()}`.padStart(2, "0");
    const hours = `${check.getHours()}`.padStart(2, "0");
    const minutes = `${check.getMinutes()}`.padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}