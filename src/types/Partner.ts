import { Timestamp } from "firebase/firestore";

/**
 * Partner (Ortak) - Sirket ortaklarini temsil eder
 * currentBalance: Pozitif = Fazla alinan (ortak sirket borclu), Negatif = Eksik alinan (sirket ortaga borclu)
 */
export interface Partner {
  id: string;
  name: string;                  // Ortak adi (Omer, Burak, Kazim vb.)
  sharePercentage: number;       // Hisse orani (%, orn: 40)
  baseSalary: number;            // Aylik sabit maas (orn: 30000)
  
  currentBalance: number;        // Guncel bakiye (son CLOSED statement'tan)
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
 * PartnerStatement - Ortaklarin aylik hesap ozeti
 * Her ortak icin her ay bir statement kaydi tutulur
 * 
 * Formul:
 * nextMonthBalance = previousBalance + actualWithdrawn - (personalExpenseReimbursement + monthlySalary + profitShare)
 */
export interface PartnerStatement {
  id: string;
  partnerId: string;             // Ilgili ortak ID'si

  month: number;                 // Ay (1-12, Ocak=1)
  year: number;                  // Yil (orn: 2025)

  status: "DRAFT" | "CLOSED";    // Taslak veya Kapali

  // Hesap alanlari
  previousBalance: number;               // Onceki aydan devreden bakiye
  personalExpenseReimbursement: number;  // Bu ay odenen kisisel gider iadesi
  monthlySalary: number;                 // Bu ay maas
  profitShare: number;                   // Bu ay kar payi
  actualWithdrawn: number;               // Bu ay fiilen cekilen para
  nextMonthBalance: number;              // Hesaplanan sonraki ay bakiyesi

  note?: string;                 // Opsiyonel aciklama

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
 * Partner olusturma/guncelleme icin form data
 */
export interface PartnerFormData {
  name: string;
  sharePercentage: number;
  baseSalary: number;
}

/**
 * PartnerStatement olusturma/guncelleme icin form data
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
 * Partner Statement History Entry - Dönem değişiklik geçmişi
 */
export interface PartnerStatementHistoryEntry {
  id: string;
  statementId: string;
  partnerId: string;
  previousData: Partial<PartnerStatement>;
  changedAt: import('firebase/firestore').Timestamp;
  changedByUserId: string;
  changedByEmail?: string;
  changedByDisplayName?: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'CLOSE' | 'REOPEN';
}

/**
 * Ay isimleri (Turkce)
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
 * Yeni mantik: onceki bakiye + gercekte cekilen - (kisisel harcama iadesi + maas + kar payi)
 */
export const calculateNextMonthBalance = (
  previousBalance: number,
  personalExpenseReimbursement: number,
  monthlySalary: number,
  profitShare: number,
  actualWithdrawn: number
): number => {
  return previousBalance + actualWithdrawn - (personalExpenseReimbursement + monthlySalary + profitShare);
};
