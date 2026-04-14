import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica se um usuário está online com base no status e no tempo da última atividade.
 * Consideramos online se o status for true e a última atividade foi há menos de 2 minutos.
 */
export function isUserReallyOnline(isOnline: boolean, lastSeen: string | null) {
  if (!isOnline || !lastSeen) return false;
  
  const lastSeenDate = new Date(lastSeen).getTime();
  const now = new Date().getTime();
  const diffInMinutes = (now - lastSeenDate) / 1000 / 60;
  
  return diffInMinutes < 2; // 2 minutos de tolerância
}