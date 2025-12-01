import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { CompanyOverview, CompanyOverviewFormData } from "../types/CompanyOverview";
import { DEFAULT_COMPANY_OVERVIEW } from "../types/CompanyOverview";

// Sabit doküman ID'si
const COMPANY_OVERVIEW_DOC_ID = "main";
const COLLECTION_NAME = "company_overview";

/**
 * Şirket genel bakış verisini getir
 * Eğer yoksa varsayılan değerlerle oluştur
 */
export const getCompanyOverview = async (): Promise<CompanyOverview> => {
  const docRef = doc(db, COLLECTION_NAME, COMPANY_OVERVIEW_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as CompanyOverview;
  }

  // Doküman yoksa varsayılan değerlerle oluştur
  const defaultData = {
    ...DEFAULT_COMPANY_OVERVIEW,
    lastUpdatedAt: serverTimestamp(),
  };

  await setDoc(docRef, defaultData);

  // Yeni oluşturulan veriyi döndür
  const newDocSnap = await getDoc(docRef);
  return {
    id: newDocSnap.id,
    ...newDocSnap.data(),
  } as CompanyOverview;
};

/**
 * Şirket kasasını güncelle
 */
export const updateCompanyOverview = async (
  data: CompanyOverviewFormData,
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, COMPANY_OVERVIEW_DOC_ID);

  await setDoc(
    docRef,
    {
      companySafeBalance: data.companySafeBalance,
      currency: data.currency || "TRY",
      lastUpdatedAt: serverTimestamp(),
      ...(user && {
        updatedByUserId: user.uid,
        updatedByEmail: user.email,
        updatedByDisplayName: user.displayName || "",
      }),
    },
    { merge: true }
  );
};

/**
 * Para birimi formatla
 */
export const formatCurrency = (
  amount: number,
  currency: string = "TRY"
): string => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
