import { Timestamp } from "firebase/firestore";

/**
 * Partner (Ortak) - Şirket ortaklarını temsil eder
 * currentBalance: Pozitif = Şirket ortağa borçlu, Negatif = Ortak şirkete borçlu
 */
export interface Partner {
  id: string;
  name: string;                  // Ortak adı (Ömer, Burak, Kazım vb.)
  sharePercentage: number;       // Hisse oranı (%, örn: 40)
  baseSalary: number;            // Aylık sabit maaş (örn: 30000)
  
  currentBalance: number;        // Güncel bakiye (son CLOSED statement'tan)
  isActive: boolean;             // Ortak aktif mi?

  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Audit fields
  createdBy?: string;
  createdByEmail?: string;
  createdByDisplayName?: string;
  updatedBy?: string;
  updatedByEmail?: string;
  updatedByDisplayName?: string;
}

/**
 * PartnerStatement - Ortağın aylık hesap özeti
 * Her ortak için her ay bir statement kaydı tutulur
 * 
 * Formül:
 * nextMonthBalance = previousBalance + personalExpenseReimbursement + monthlySalary + profitShare - actualWithdrawn
 */
export interface PartnerStatement {
  id: string;
  partnerId: string;             // İlgili ortak ID'si

  month: number;                 // Ay (1-12, Ocak=1)
  year: number;                  // Yıl (örn: 2025)

  status: "DRAFT" | "CLOSED";    // Taslak veya Kapalı

  // Hesap alanları
  previousBalance: number;               // Önceki aydan devreden bakiye
  personalExpenseReimbursement: number;  // Bu ay ödenen kişisel gider iadesi
  monthlySalary: number;                 // Bu ay maaş
  profitShare: number;                   // Bu ay kar payı
  actualWithdrawn: number;               // Bu ay fiilen çekilen para
  nextMonthBalance: number;              // Hesaplanan sonraki ay bakiyesi

  note?: string;                 // Opsiyonel açıklama

  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Audit fields
  createdBy?: string;
  createdByEmail?: string;
  createdByDisplayName?: string;
  updatedBy?: string;
  updatedByEmail?: string;
  updatedByDisplayName?: string;
}

/**
 * Partner oluşturma/güncelleme için form data
 */
export interface PartnerFormData {
  name: string;
  sharePercentage: number;
  baseSalary: number;
}

/**
 * PartnerStatement oluşturma/güncelleme için form data
 */
export interface PartnerStatementFormData {
  month: number;
  year: number;
  previousBalance: number;
  personalExpenseReimbursement: number;
  monthlySalary: number;
  profitShare: number;
  actualWithdrawn: number;
  note?: string;
}

/**
 * Ay isimleri (Türkçe)
 */
export const MONTH_NAMES: Record<number, string> = {
  1: 'Ocak',
  2: 'Şubat',
  3: 'Mart',
  4: 'Nisan',
  5: 'Mayıs',
  6: 'Haziran',
  7: 'Temmuz',
  8: 'Ağustos',
  9: 'Eylül',
  10: 'Ekim',
  11: 'Kasım',
  12: 'Aralık',
};

/**
 * nextMonthBalance hesaplama fonksiyonu
 */
export const calculateNextMonthBalance = (
  previousBalance: number,
  personalExpenseReimbursement: number,
  monthlySalary: number,
  profitShare: number,
  actualWithdrawn: number
): number => {
  return previousBalance + personalExpenseReimbursement + monthlySalary + profitShare - actualWithdrawn;
};
