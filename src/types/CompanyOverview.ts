import { Timestamp } from "firebase/firestore";

/**
 * Şirket genel finansal durumu
 * Tek bir doküman olarak saklanır (id: "main")
 */
export interface CompanyOverview {
  id: string;                    // "main" - sabit ID
  companySafeBalance: number;    // Şirket kasası (banka + nakit) toplamı
  currency: string;              // Para birimi (varsayılan: "TRY")
  lastUpdatedAt: Timestamp;      // Son güncelleme tarihi

  // Audit alanları
  updatedByUserId?: string;
  updatedByEmail?: string;
  updatedByDisplayName?: string;
}

/**
 * Form verisi - güncelleme için
 */
export interface CompanyOverviewFormData {
  companySafeBalance: number;
  currency?: string;
}

/**
 * Varsayılan değerler
 */
export const DEFAULT_COMPANY_OVERVIEW: Omit<CompanyOverview, 'id' | 'lastUpdatedAt'> = {
  companySafeBalance: 0,
  currency: 'TRY',
};
