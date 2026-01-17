export const formatAdmissionTime = (admissionDate: string) => {
    const admission = new Date(admissionDate);
    const now = new Date();
    const diffMs = now.getTime() - admission.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        const remainingHours = diffHours % 24;
        return `Ingresado hace: ${diffDays} día${diffDays > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
    } else if (diffHours > 0) {
        return `Ingresado hace: ${diffHours} horas ${diffMinutes} min`;
    } else {
        return `Ingresado hace: ${diffMinutes} min`;
    }
};

export const formatCheckInTime = (checkInTime: string) => {
    const checkIn = new Date(checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - checkIn.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        const remainingHours = diffHours % 24;
        return `${diffDays} día${diffDays > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
    } else if (diffHours > 0) {
        return `${diffHours} horas ${diffMinutes} min`;
    } else {
        return `${diffMinutes} min`;
    }
};



