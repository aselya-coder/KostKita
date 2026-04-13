/**
 * Menghitung sisa hari dari tanggal sekarang ke tanggal kedaluwarsa.
 * @param expiresAt Tanggal kedaluwarsa dalam format ISO string.
 * @returns Jumlah hari tersisa (minimal 0).
 */
export const calculateRemainingDays = (expiresAt: string | null | undefined): number => {
  if (!expiresAt) return 0;
  
  const end = new Date(expiresAt);
  const now = new Date();
  
  // Reset jam, menit, detik ke 0 untuk perhitungan hari yang bersih
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = endDate.getTime() - nowDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * Format sisa hari ke dalam teks yang ramah pengguna.
 */
export const formatRemainingDays = (expiresAt: string | null | undefined): string => {
  const days = calculateRemainingDays(expiresAt);
  if (days <= 0) return 'Kedaluwarsa';
  return `${days} hari lagi`;
};
