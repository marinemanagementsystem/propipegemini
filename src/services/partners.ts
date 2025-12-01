import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  Partner,
  PartnerStatement,
  PartnerFormData,
  PartnerStatementFormData,
  PartnerStatementHistoryEntry,
} from "../types/Partner";
import { calculateNextMonthBalance } from "../types/Partner";

// Collection references
const partnersCollection = collection(db, "partners");
const partnerStatementsCollection = collection(db, "partner_statements");

// ============================================
// HISTORY FONKSİYONLARI
// ============================================

/**
 * Statement için history kaydı ekle
 */
export const addStatementHistory = async (
  statementId: string,
  partnerId: string,
  previousData: Partial<PartnerStatement>,
  changeType: PartnerStatementHistoryEntry['changeType'],
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  const historyCollection = collection(db, 'partner_statements', statementId, 'history');
  
  await addDoc(historyCollection, {
    statementId,
    partnerId,
    previousData,
    changeType,
    changedAt: serverTimestamp(),
    changedByUserId: user?.uid || 'system',
    changedByEmail: user?.email || '',
    changedByDisplayName: user?.displayName || '',
  });
};

/**
 * Statement'ın history kayıtlarını getir
 */
export const getStatementHistory = async (
  statementId: string
): Promise<PartnerStatementHistoryEntry[]> => {
  try {
    const historyCollection = collection(db, 'partner_statements', statementId, 'history');
    const q = query(historyCollection, orderBy('changedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as PartnerStatementHistoryEntry[];
  } catch (error) {
    console.error('getStatementHistory error:', error);
    return [];
  }
};

// ============================================
// PARTNER (ORTAK) FONKSİYONLARI
// ============================================

/**
 * Tüm ortakları getir
 */
export const getPartners = async (): Promise<Partner[]> => {
  const q = query(partnersCollection, orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Partner[];
};

/**
 * Aktif ortakları getir
 */
export const getActivePartners = async (): Promise<Partner[]> => {
  const q = query(
    partnersCollection,
    where("isActive", "==", true),
    orderBy("name", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Partner[];
};

/**
 * ID'ye göre ortak getir
 */
export const getPartnerById = async (partnerId: string): Promise<Partner | null> => {
  const docRef = doc(db, "partners", partnerId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Partner;
};

/**
 * Yeni ortak oluştur
 */
export const createPartner = async (
  data: PartnerFormData,
  user?: { uid: string; email: string; displayName?: string }
): Promise<string> => {
  const now = serverTimestamp();
  const docRef = await addDoc(partnersCollection, {
    name: data.name,
    sharePercentage: data.sharePercentage,
    baseSalary: data.baseSalary,
    currentBalance: 0, // Başlangıç bakiyesi 0
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...(user && {
      createdBy: user.uid,
      createdByEmail: user.email,
      createdByDisplayName: user.displayName || "",
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });
  return docRef.id;
};

/**
 * Ortak güncelle
 */
export const updatePartner = async (
  partnerId: string,
  updates: Partial<PartnerFormData>,
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  const docRef = doc(db, "partners", partnerId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
    ...(user && {
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });
};

/**
 * Ortak durumunu değiştir (aktif/pasif)
 */
export const togglePartnerActive = async (
  partnerId: string,
  isActive: boolean,
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  const docRef = doc(db, "partners", partnerId);
  await updateDoc(docRef, {
    isActive,
    updatedAt: serverTimestamp(),
    ...(user && {
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });
};

// ============================================
// PARTNER STATEMENT (ORTAK HESAP ÖZETİ) FONKSİYONLARI
// ============================================

/**
 * Bir ortağın tüm statement'larını getir (yıl ve ay'a göre azalan sıralı)
 */
export const getPartnerStatements = async (partnerId: string): Promise<PartnerStatement[]> => {
  try {
    // Sadece partnerId ile sorgula, sıralamayı client-side yap (index sorunu önlemek için)
    const q = query(
      partnerStatementsCollection,
      where("partnerId", "==", partnerId)
    );
    const snapshot = await getDocs(q);
    const statements = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartnerStatement[];
    
    // Client-side sıralama: önce yıl (desc), sonra ay (desc)
    return statements.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  } catch (error) {
    console.error('getPartnerStatements error:', error);
    return [];
  }
};

/**
 * ID'ye göre statement getir
 */
export const getPartnerStatementById = async (
  statementId: string
): Promise<PartnerStatement | null> => {
  const docRef = doc(db, "partner_statements", statementId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as PartnerStatement;
};

/**
 * Bir ortağın son CLOSED statement'ını getir
 */
export const getLastClosedStatement = async (
  partnerId: string
): Promise<PartnerStatement | null> => {
  const q = query(
    partnerStatementsCollection,
    where("partnerId", "==", partnerId),
    where("status", "==", "CLOSED"),
    orderBy("year", "desc"),
    orderBy("month", "desc")
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as PartnerStatement;
};

/**
 * Belirli ay/yıl için mevcut statement var mı kontrol et
 */
export const checkStatementExists = async (
  partnerId: string,
  month: number,
  year: number
): Promise<boolean> => {
  const q = query(
    partnerStatementsCollection,
    where("partnerId", "==", partnerId),
    where("month", "==", month),
    where("year", "==", year)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Yeni statement oluştur
 */
export const createPartnerStatement = async (
  partnerId: string,
  data: PartnerStatementFormData,
  user?: { uid: string; email: string; displayName?: string }
): Promise<string> => {
  // nextMonthBalance hesapla
  const nextMonthBalance = calculateNextMonthBalance(
    data.previousBalance,
    data.personalExpenseReimbursement,
    data.monthlySalary,
    data.profitShare,
    data.actualWithdrawn
  );

  const now = serverTimestamp();
  const docRef = await addDoc(partnerStatementsCollection, {
    partnerId,
    month: data.month,
    year: data.year,
    status: "DRAFT",
    previousBalance: data.previousBalance,
    personalExpenseReimbursement: data.personalExpenseReimbursement,
    monthlySalary: data.monthlySalary,
    profitShare: data.profitShare,
    actualWithdrawn: data.actualWithdrawn,
    nextMonthBalance,
    note: data.note || "",
    createdAt: now,
    updatedAt: now,
    ...(user && {
      createdBy: user.uid,
      createdByEmail: user.email,
      createdByDisplayName: user.displayName || "",
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });

  // History kaydı ekle (CREATE)
  const createdStatement = {
    id: docRef.id,
    partnerId,
    month: data.month,
    year: data.year,
    status: "DRAFT" as const,
    previousBalance: data.previousBalance,
    personalExpenseReimbursement: data.personalExpenseReimbursement,
    monthlySalary: data.monthlySalary,
    profitShare: data.profitShare,
    actualWithdrawn: data.actualWithdrawn,
    nextMonthBalance,
    note: data.note || "",
  };
  await addStatementHistory(docRef.id, partnerId, createdStatement as PartnerStatement, 'CREATE', user);

  return docRef.id;
};

/**
 * Statement güncelle (DRAFT ve CLOSED için çalışır)
 */
export const updatePartnerStatement = async (
  statementId: string,
  updates: Partial<PartnerStatementFormData>,
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  // Mevcut statement'ı al
  const statement = await getPartnerStatementById(statementId);
  if (!statement) throw new Error("Statement bulunamadı");

  // History kaydı ekle
  await addStatementHistory(statementId, statement.partnerId, statement, 'UPDATE', user);

  // Güncel değerler ile nextMonthBalance hesapla
  const previousBalance = updates.previousBalance ?? statement.previousBalance;
  const personalExpenseReimbursement =
    updates.personalExpenseReimbursement ?? statement.personalExpenseReimbursement;
  const monthlySalary = updates.monthlySalary ?? statement.monthlySalary;
  const profitShare = updates.profitShare ?? statement.profitShare;
  const actualWithdrawn = updates.actualWithdrawn ?? statement.actualWithdrawn;

  const nextMonthBalance = calculateNextMonthBalance(
    previousBalance,
    personalExpenseReimbursement,
    monthlySalary,
    profitShare,
    actualWithdrawn
  );

  const docRef = doc(db, "partner_statements", statementId);
  await updateDoc(docRef, {
    ...updates,
    nextMonthBalance,
    updatedAt: serverTimestamp(),
    ...(user && {
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });

  // Eğer CLOSED ise partner bakiyesini de güncelle
  if (statement.status === 'CLOSED') {
    const partnerRef = doc(db, "partners", statement.partnerId);
    await updateDoc(partnerRef, {
      currentBalance: nextMonthBalance,
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Statement sil (sadece DRAFT durumundayken)
 */
export const deletePartnerStatement = async (statementId: string): Promise<void> => {
  const statement = await getPartnerStatementById(statementId);
  if (!statement) throw new Error("Statement bulunamadı");
  if (statement.status === "CLOSED") throw new Error("Kapalı dönem silinemez");

  const docRef = doc(db, "partner_statements", statementId);
  await deleteDoc(docRef);
};

/**
 * Statement'ın nextMonthBalance değerini yeniden hesapla
 */
export const recalculatePartnerStatement = async (
  statementId: string,
  user?: { uid: string; email: string; displayName?: string }
): Promise<number> => {
  const statement = await getPartnerStatementById(statementId);
  if (!statement) throw new Error("Statement bulunamadı");

  const nextMonthBalance = calculateNextMonthBalance(
    statement.previousBalance,
    statement.personalExpenseReimbursement,
    statement.monthlySalary,
    statement.profitShare,
    statement.actualWithdrawn
  );

  const docRef = doc(db, "partner_statements", statementId);
  await updateDoc(docRef, {
    nextMonthBalance,
    updatedAt: serverTimestamp(),
    ...(user && {
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });

  return nextMonthBalance;
};

/**
 * Dönemi kapat - Statement'ı CLOSED yap ve partner.currentBalance'ı güncelle
 */
export const closePartnerStatement = async (
  statementId: string,
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  // Statement'ı al
  const statement = await getPartnerStatementById(statementId);
  if (!statement) throw new Error("Statement bulunamadı");
  if (statement.status === "CLOSED") throw new Error("Bu dönem zaten kapalı");

  // History kaydı ekle
  await addStatementHistory(statementId, statement.partnerId, statement, 'CLOSE', user);

  // nextMonthBalance'ı son kez hesapla
  const nextMonthBalance = calculateNextMonthBalance(
    statement.previousBalance,
    statement.personalExpenseReimbursement,
    statement.monthlySalary,
    statement.profitShare,
    statement.actualWithdrawn
  );

  // Statement'ı güncelle (CLOSED yap)
  const statementRef = doc(db, "partner_statements", statementId);
  await updateDoc(statementRef, {
    status: "CLOSED",
    nextMonthBalance,
    updatedAt: serverTimestamp(),
    ...(user && {
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });

  // Partner'ın currentBalance'ını güncelle
  const partnerRef = doc(db, "partners", statement.partnerId);
  await updateDoc(partnerRef, {
    currentBalance: nextMonthBalance,
    updatedAt: serverTimestamp(),
    ...(user && {
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });
};

/**
 * Dönemi yeniden aç - CLOSED statement'ı DRAFT yap
 */
export const reopenPartnerStatement = async (
  statementId: string,
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  // Statement'ı al
  const statement = await getPartnerStatementById(statementId);
  if (!statement) throw new Error("Statement bulunamadı");
  if (statement.status === "DRAFT") throw new Error("Bu dönem zaten açık");

  // History kaydı ekle
  await addStatementHistory(statementId, statement.partnerId, statement, 'REOPEN', user);

  // Statement'ı güncelle (DRAFT yap)
  const statementRef = doc(db, "partner_statements", statementId);
  await updateDoc(statementRef, {
    status: "DRAFT",
    updatedAt: serverTimestamp(),
    ...(user && {
      updatedBy: user.uid,
      updatedByEmail: user.email,
      updatedByDisplayName: user.displayName || "",
    }),
  });
};

/**
 * Yeni statement için önerilen previousBalance değerini al
 * - Son CLOSED statement varsa: onun nextMonthBalance değeri
 * - Yoksa: 0 (ve kullanıcı düzenleyebilir)
 */
export const getSuggestedPreviousBalance = async (
  partnerId: string
): Promise<{ value: number; isEditable: boolean }> => {
  try {
    // Tüm statement'ları al ve client-side filtrele (index sorunu yaşamamak için)
    const allStatements = await getPartnerStatements(partnerId);
    
    if (allStatements.length === 0) {
      return {
        value: 0,
        isEditable: true, // İlk statement, açılış bakiyesi girilebilir
      };
    }
    
    // CLOSED olanları filtrele ve en yenisini bul
    const closedStatements = allStatements.filter(s => s.status === 'CLOSED');
    
    if (closedStatements.length > 0) {
      // En yeni CLOSED statement (zaten year desc, month desc sıralı)
      const lastClosed = closedStatements[0];
      return {
        value: lastClosed.nextMonthBalance,
        isEditable: false, // Son kapalı dönemden devir, düzenlenemez
      };
    }
    
    // Sadece DRAFT statement'lar var
    return {
      value: 0,
      isEditable: true,
    };
  } catch (error) {
    console.error('getSuggestedPreviousBalance error:', error);
    return {
      value: 0,
      isEditable: true,
    };
  }
};

/**
 * Excel'deki örnek verileri Firebase'e ekle
 * Bu fonksiyon sadece test amaçlıdır
 */
export const seedPartnersData = async (
  user?: { uid: string; email: string; displayName?: string }
): Promise<void> => {
  const now = serverTimestamp();

  // 1. Ortakları ekle
  const partnersData = [
    {
      name: 'Ömer',
      sharePercentage: 40,
      baseSalary: 100000,
      currentBalance: 74578, // Son dönem sonucu
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...(user && {
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByDisplayName: user.displayName || '',
      }),
    },
    {
      name: 'Burak',
      sharePercentage: 40,
      baseSalary: 0,
      currentBalance: 54188, // Son dönem sonucu
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...(user && {
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByDisplayName: user.displayName || '',
      }),
    },
    {
      name: 'Kazım',
      sharePercentage: 20,
      baseSalary: 50000,
      currentBalance: -130586, // Son dönem sonucu (eksik alınan)
      isActive: true,
      createdAt: now,
      updatedAt: now,
      ...(user && {
        createdBy: user.uid,
        createdByEmail: user.email,
        createdByDisplayName: user.displayName || '',
      }),
    },
  ];

  const partnerIds: Record<string, string> = {};

  for (const partner of partnersData) {
    const docRef = await addDoc(partnersCollection, partner);
    partnerIds[partner.name] = docRef.id;
    console.log(`✅ Ortak eklendi: ${partner.name}`);
  }

  // 2. Haziran 2025 dönemleri
  const haziran2025 = [
    {
      partnerId: partnerIds['Ömer'],
      month: 6,
      year: 2025,
      status: 'CLOSED',
      previousBalance: 0,
      personalExpenseReimbursement: 33250, // Hakediş sıfırlama
      monthlySalary: 100000,
      profitShare: 13972, // Kar payı
      actualWithdrawn: 160000,
      nextMonthBalance: 12778, // 0 + 160000 - (33250 + 100000 + 13972)
      note: 'Haziran 2025 - Hakediş: 420.000 TRY',
      createdAt: now,
      updatedAt: now,
    },
    {
      partnerId: partnerIds['Burak'],
      month: 6,
      year: 2025,
      status: 'CLOSED',
      previousBalance: 0,
      personalExpenseReimbursement: 1820,
      monthlySalary: 0,
      profitShare: 115792,
      actualWithdrawn: 160000,
      nextMonthBalance: 42388, // 0 + 160000 - (1820 + 0 + 115792)
      note: 'Haziran 2025 - Hakediş: 420.000 TRY',
      createdAt: now,
      updatedAt: now,
    },
    {
      partnerId: partnerIds['Kazım'],
      month: 6,
      year: 2025,
      status: 'CLOSED',
      previousBalance: 0,
      personalExpenseReimbursement: 100000,
      monthlySalary: 50000,
      profitShare: 6986,
      actualWithdrawn: 100000,
      nextMonthBalance: -56986, // 0 + 100000 - (100000 + 50000 + 6986)
      note: 'Haziran 2025 - Hakediş: 420.000 TRY',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const stmt of haziran2025) {
    await addDoc(partnerStatementsCollection, stmt);
  }
  console.log('✅ Haziran 2025 dönemleri eklendi');

  // 3. Temmuz 2025 dönemleri (Ek hakediş)
  const temmuz2025 = [
    {
      partnerId: partnerIds['Ömer'],
      month: 7,
      year: 2025,
      status: 'CLOSED',
      previousBalance: 12778,
      personalExpenseReimbursement: 0,
      monthlySalary: 0,
      profitShare: 247200, // 618.000 * %40
      actualWithdrawn: 309000,
      nextMonthBalance: 74578, // 12778 + 309000 - (0 + 0 + 247200)
      note: 'Temmuz 2025 - Ek Hakediş: 618.000 TRY',
      createdAt: now,
      updatedAt: now,
    },
    {
      partnerId: partnerIds['Burak'],
      month: 7,
      year: 2025,
      status: 'CLOSED',
      previousBalance: 42388,
      personalExpenseReimbursement: 0,
      monthlySalary: 0,
      profitShare: 247200, // 618.000 * %40
      actualWithdrawn: 259000,
      nextMonthBalance: 54188, // 42388 + 259000 - (0 + 0 + 247200)
      note: 'Temmuz 2025 - Ek Hakediş: 618.000 TRY',
      createdAt: now,
      updatedAt: now,
    },
    {
      partnerId: partnerIds['Kazım'],
      month: 7,
      year: 2025,
      status: 'CLOSED',
      previousBalance: -56986,
      personalExpenseReimbursement: 0,
      monthlySalary: 0,
      profitShare: 123600, // 618.000 * %20
      actualWithdrawn: 50000,
      nextMonthBalance: -130586, // -56986 + 50000 - (0 + 0 + 123600)
      note: 'Temmuz 2025 - Ek Hakediş: 618.000 TRY',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const stmt of temmuz2025) {
    await addDoc(partnerStatementsCollection, stmt);
  }
  console.log('✅ Temmuz 2025 dönemleri eklendi');
  console.log('✅ Tüm örnek veriler başarıyla eklendi!');
};
