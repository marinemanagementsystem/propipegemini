import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { getCompanyOverview } from "./companyOverview";
import type { CompanyOverview } from "../types/CompanyOverview";
import type { Expense } from "../types/Expense";
import type { Project, ProjectStatement } from "../types/Project";
import type { Partner } from "../types/Partner";
import type { NetworkContact } from "../types/Network";

// ==================== TİPLER ====================

export interface DashboardSummary {
  companySafeBalance: number;
  currency: string;
  lastUpdatedAt: Timestamp | null;
  totalProjectsBalance: number;
  totalProjectsCount: number;
  totalPaidExpensesThisMonth: number;
  totalPartnersPositive: number;  // Şirketin ortaklara borcu
  totalPartnersNegative: number;  // Ortakların şirkete borcu (mutlak değer)
}

export interface MonthlyTrendItem {
  monthLabel: string;     // "Ocak", "Şubat" gibi
  monthKey: string;       // "2025-01" formatı (sıralama için)
  total: number;
}

export interface StatementTrendItem {
  monthLabel: string;
  monthKey: string;
  totalNetCash: number;
  statementCount: number;
}

export interface NetworkActionItem {
  id: string;
  companyName: string;
  contactPerson: string;
  phone?: string;
  category: string;
  quoteStatus: string;
  result?: string;
  lastContactDate?: Timestamp;
  nextActionDate?: Timestamp;
  isOverdue: boolean;
}

export interface StatementWithProject extends ProjectStatement {
  projectName: string;
}

// ==================== YARDIMCI FONKSİYONLAR ====================

const MONTH_NAMES_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

/**
 * Belirli bir ayın başlangıç ve bitiş tarihlerini döndür
 */
const getMonthRange = (year: number, month: number): { start: Date; end: Date } => {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

/**
 * Son N ayın tarih aralıklarını döndür
 */
const getLastNMonthsRanges = (n: number): { year: number; month: number; label: string; key: string }[] => {
  const result: { year: number; month: number; label: string; key: string }[] = [];
  const now = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    result.push({
      year,
      month,
      label: MONTH_NAMES_TR[month],
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
    });
  }
  
  return result;
};

/**
 * Timestamp'i "YYYY-MM" formatına çevir
 */
const timestampToMonthKey = (timestamp: Timestamp): string => {
  const date = timestamp.toDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

// ==================== ANA SERVİS FONKSİYONLARI ====================

/**
 * Şirket genel bakış verisini getir
 */
export const getCompanyOverviewData = async (): Promise<CompanyOverview> => {
  return await getCompanyOverview();
};

/**
 * Dashboard özet kartları için tüm verileri getir
 */
export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  // Paralel olarak tüm sorguları çalıştır
  const [
    companyOverview,
    projectsBalance,
    paidExpenses,
    partnersData,
  ] = await Promise.all([
    getCompanyOverview(),
    getTotalProjectsBalance(),
    getPaidExpensesThisMonth(),
    getPartnersBalanceSummary(),
  ]);

  return {
    companySafeBalance: companyOverview.companySafeBalance,
    currency: companyOverview.currency,
    lastUpdatedAt: companyOverview.lastUpdatedAt,
    totalProjectsBalance: projectsBalance.total,
    totalProjectsCount: projectsBalance.count,
    totalPaidExpensesThisMonth: paidExpenses,
    totalPartnersPositive: partnersData.positive,
    totalPartnersNegative: partnersData.negative,
  };
};

/**
 * Tersanelerdeki toplam bakiyeyi hesapla
 */
const getTotalProjectsBalance = async (): Promise<{ total: number; count: number }> => {
  const projectsRef = collection(db, "projects");
  const snapshot = await getDocs(projectsRef);
  
  let total = 0;
  let count = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data() as Project;
    if (data.currentBalance !== undefined) {
      total += data.currentBalance;
      count++;
    }
  });
  
  return { total, count };
};

/**
 * Bu ayki ödenen giderlerin toplamını hesapla
 */
const getPaidExpensesThisMonth = async (): Promise<number> => {
  const now = new Date();
  const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());
  
  // Index gerektirmemek için tüm PAID giderleri çekip JS'de filtrele
  const expensesRef = collection(db, "expenses");
  const q = query(
    expensesRef,
    where("status", "==", "PAID")
  );
  
  const snapshot = await getDocs(q);
  let total = 0;
  
  snapshot.forEach((doc) => {
    const data = doc.data() as Expense;
    if (!data.isDeleted && data.date) {
      const expenseDate = data.date.toDate();
      if (expenseDate >= start && expenseDate <= end) {
        total += data.amount || 0;
      }
    }
  });
  
  return total;
};

/**
 * Ortakların bakiye özetini hesapla
 */
const getPartnersBalanceSummary = async (): Promise<{ positive: number; negative: number }> => {
  const partnersRef = collection(db, "partners");
  const snapshot = await getDocs(partnersRef);
  
  let positive = 0;  // Şirketin ortaklara borcu
  let negative = 0;  // Ortakların şirkete borcu
  
  snapshot.forEach((doc) => {
    const data = doc.data() as Partner;
    if (data.isActive !== false) {
      const balance = data.currentBalance || 0;
      if (balance > 0) {
        positive += balance;
      } else if (balance < 0) {
        negative += Math.abs(balance);
      }
    }
  });
  
  return { positive, negative };
};

/**
 * Son 6 ay ödenen gider trendini getir
 */
export const getLast6MonthsExpensesTrend = async (): Promise<MonthlyTrendItem[]> => {
  const months = getLastNMonthsRanges(6);
  
  // Son 6 ayın tüm tarih aralığını al
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const startDate = new Date(firstMonth.year, firstMonth.month, 1);
  const endDate = new Date(lastMonth.year, lastMonth.month + 1, 0, 23, 59, 59);
  
  // Firestore sorgusu - Index gerektirmemek için sadece status ile sorgula
  const expensesRef = collection(db, "expenses");
  const q = query(
    expensesRef,
    where("status", "==", "PAID")
  );
  
  const snapshot = await getDocs(q);
  
  // Aylık toplama
  const monthlyTotals: Record<string, number> = {};
  months.forEach(m => {
    monthlyTotals[m.key] = 0;
  });
  
  snapshot.forEach((doc) => {
    const data = doc.data() as Expense;
    if (!data.isDeleted && data.date) {
      const expenseDate = data.date.toDate();
      // Tarih aralığı kontrolü JS'de yap
      if (expenseDate >= startDate && expenseDate <= endDate) {
        const monthKey = timestampToMonthKey(data.date);
        if (monthlyTotals[monthKey] !== undefined) {
          monthlyTotals[monthKey] += data.amount || 0;
        }
      }
    }
  });
  
  // Sonuç dizisi
  return months.map(m => ({
    monthLabel: m.label,
    monthKey: m.key,
    total: monthlyTotals[m.key],
  }));
};

/**
 * Son 6 ay hakediş net sonuç trendini getir
 */
export const getLast6MonthsStatementsTrend = async (): Promise<StatementTrendItem[]> => {
  const months = getLastNMonthsRanges(6);
  
  // Son 6 ayın tüm tarih aralığını al
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const startDate = new Date(firstMonth.year, firstMonth.month, 1);
  const endDate = new Date(lastMonth.year, lastMonth.month + 1, 0, 23, 59, 59);
  
  // Firestore sorgusu - Index gerektirmemek için sadece status ile sorgula
  const statementsRef = collection(db, "project_statements");
  const q = query(
    statementsRef,
    where("status", "==", "CLOSED")
  );
  
  const snapshot = await getDocs(q);
  
  // Aylık toplama
  const monthlyData: Record<string, { total: number; count: number }> = {};
  months.forEach(m => {
    monthlyData[m.key] = { total: 0, count: 0 };
  });
  
  snapshot.forEach((doc) => {
    const data = doc.data() as ProjectStatement;
    if (data.date) {
      const statementDate = data.date.toDate();
      // Tarih aralığı kontrolü JS'de yap
      if (statementDate >= startDate && statementDate <= endDate) {
        const monthKey = timestampToMonthKey(data.date);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].total += data.totals?.netCashReal || 0;
          monthlyData[monthKey].count += 1;
        }
      }
    }
  });
  
  // Sonuç dizisi
  return months.map(m => ({
    monthLabel: m.label,
    monthKey: m.key,
    totalNetCash: monthlyData[m.key].total,
    statementCount: monthlyData[m.key].count,
  }));
};

/**
 * Bugün veya bu hafta aranması gereken network kişilerini getir
 */
export const getUpcomingNetworkActions = async (): Promise<NetworkActionItem[]> => {
  const networkRef = collection(db, "network");
  
  // 7 gün sonrası
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);
  
  // Firestore'da OR sorgusu olmadığı için tüm verileri çekip JS'de filtreleyelim
  const snapshot = await getDocs(networkRef);
  const results: NetworkActionItem[] = [];
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  snapshot.forEach((doc) => {
    const data = doc.data() as NetworkContact;
    
    // Silinen veya kaybedilen işleri hariç tut
    if (data.isDeleted) return;
    if (data.result === 'RED' || data.result === 'IS_YOK' || data.result === 'DONUS_YOK') return;
    
    // nextActionDate kontrolü
    if (data.nextActionDate) {
      const actionDate = data.nextActionDate.toDate();
      const isOverdue = actionDate < todayStart;
      const isWithinWeek = actionDate <= nextWeek;
      
      if (isWithinWeek) {
        results.push({
          id: doc.id,
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          phone: data.phone,
          category: data.category,
          quoteStatus: data.quoteStatus,
          result: data.result,
          lastContactDate: data.lastContactDate,
          nextActionDate: data.nextActionDate,
          isOverdue,
        });
      }
    }
  });
  
  // Sırala: Önce gecikmişler, sonra tarihe göre artan
  results.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    const dateA = a.nextActionDate?.toDate().getTime() || 0;
    const dateB = b.nextActionDate?.toDate().getTime() || 0;
    return dateA - dateB;
  });
  
  return results.slice(0, 10); // Maksimum 10 kayıt
};

/**
 * Son N gideri getir
 */
export const getLatestExpenses = async (limitCount: number = 5): Promise<Expense[]> => {
  const expensesRef = collection(db, "expenses");
  const q = query(
    expensesRef,
    orderBy("date", "desc"),
    limit(limitCount * 2) // Silinmişleri de hesaba kat
  );
  
  const snapshot = await getDocs(q);
  const results: Expense[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data() as Expense;
    if (!data.isDeleted && results.length < limitCount) {
      results.push({
        ...data,
        id: doc.id,
      } as Expense);
    }
  });
  
  return results;
};

/**
 * Son N kapatılmış hakedişi getir (proje adı ile birlikte)
 */
export const getLatestClosedStatements = async (limitCount: number = 5): Promise<StatementWithProject[]> => {
  // Önce projeleri çek (isim eşleştirmesi için)
  const projectsRef = collection(db, "projects");
  const projectsSnapshot = await getDocs(projectsRef);
  const projectsMap: Record<string, string> = {};
  projectsSnapshot.forEach((doc) => {
    const data = doc.data() as Project;
    projectsMap[doc.id] = data.name;
  });
  
  // Kapatılmış hakedişleri getir - Index gerektirmemek için sadece status ile sorgula
  const statementsRef = collection(db, "project_statements");
  const q = query(
    statementsRef,
    where("status", "==", "CLOSED")
  );
  
  const snapshot = await getDocs(q);
  
  // JS'de sırala ve limit uygula
  const allStatements: StatementWithProject[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data() as ProjectStatement;
    allStatements.push({
      ...data,
      id: doc.id,
      projectName: projectsMap[data.projectId] || "Bilinmeyen Tersane",
    } as StatementWithProject);
  });
  
  // Tarihe göre sırala (en yeniden en eskiye)
  allStatements.sort((a, b) => {
    const dateA = a.date?.toDate().getTime() || 0;
    const dateB = b.date?.toDate().getTime() || 0;
    return dateB - dateA;
  });
  
  return allStatements.slice(0, limitCount);
};

// ==================== LABEL HELPER'LAR ====================

export const getExpenseTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    COMPANY_OFFICIAL: "Şirket Resmi",
    PERSONAL: "Kişisel",
    ADVANCE: "Avans",
  };
  return labels[type] || type;
};

export const getExpenseStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PAID: "Ödendi",
    UNPAID: "Ödenmedi",
  };
  return labels[status] || status;
};

export const getTransferActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    NONE: "İşlem Yok",
    TRANSFERRED_TO_SAFE: "Kasaya Aktarıldı",
    CARRIED_OVER: "Devredildi",
  };
  return labels[action] || action;
};

export const getQuoteStatusLabelTR = (status: string): string => {
  const labels: Record<string, string> = {
    HAYIR: "Teklif Yok",
    TEKLIF_BEKLENIYOR: "Teklif Bekleniyor",
    TEKLIF_VERILDI: "Teklif Verildi",
    TEKLIF_VERILECEK: "Teklif Verilecek",
    GORUSME_DEVAM_EDIYOR: "Görüşme Devam Ediyor",
  };
  return labels[status] || status;
};

export const getCategoryLabelTR = (category: string): string => {
  const labels: Record<string, string> = {
    YENI_INSA: "Yeni İnşa",
    TAMIR: "Tamir",
    YAT: "Yat",
    ASKERI_PROJE: "Askeri Proje",
    TANKER: "Tanker",
    DIGER: "Diğer",
  };
  return labels[category] || category;
};
