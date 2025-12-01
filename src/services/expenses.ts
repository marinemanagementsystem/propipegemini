import {
      collection,
      addDoc,
      getDocs,
      updateDoc,
      deleteDoc,
      doc,
      query,
      where,
      orderBy,
      Timestamp,
      serverTimestamp,
      getDoc,
      limit
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import type { Expense, ExpenseFormData, ExpenseHistoryEntry } from "../types/Expense";

const EXPENSES_COLLECTION = "expenses";

// --- Helper: Add History Entry ---
export const addExpenseHistoryEntry = async (
      expenseId: string,
      previousData: Expense,
      user: { uid: string; email?: string | null; displayName?: string | null },
      changeType: "UPDATE" | "DELETE" | "REVERT"
): Promise<void> => {
      try {
            const historyRef = collection(db, EXPENSES_COLLECTION, expenseId, "history");
            const historyEntry: Omit<ExpenseHistoryEntry, "id"> = {
                  expenseId,
                  previousData,
                  changedAt: Timestamp.now(),
                  changedByUserId: user.uid,
                  changedByEmail: user.email || undefined,
                  changedByDisplayName: user.displayName || undefined,
                  changeType
            };
            await addDoc(historyRef, historyEntry);
      } catch (error) {
            console.error("Error adding history entry:", error);
            // History hatası ana işlemi durdurmamalı, sadece logluyoruz.
      }
};

// --- Helper: Get History ---
export const getExpenseHistory = async (expenseId: string): Promise<ExpenseHistoryEntry[]> => {
      try {
            const historyRef = collection(db, EXPENSES_COLLECTION, expenseId, "history");
            const q = query(historyRef, orderBy("changedAt", "desc"), limit(10));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
            } as ExpenseHistoryEntry));
      } catch (error) {
            console.error("Error fetching history:", error);
            throw error;
      }
};

// --- CRUD Operations ---

export const getExpenses = async (
      startDate?: Date | null,
      endDate?: Date | null,
      type?: string,
      status?: string,
      showDeleted: boolean = false
): Promise<Expense[]> => {
      try {
            // NOT: Firestore'da "isDeleted" ve "date" alanları için composite index oluşturulması gerekir.
            // Kullanıcı bu index'i oluşturana kadar hatayı önlemek için filtrelemeyi client-side yapıyoruz.
            // Bu nedenle sorgudan "where('isDeleted', ...)" kısmını kaldırıyoruz.

            let q = query(collection(db, EXPENSES_COLLECTION), orderBy("date", "desc"));

            // Tarih Filtresi
            if (startDate) {
                  q = query(q, where("date", ">=", Timestamp.fromDate(startDate)));
            }
            if (endDate) {
                  // Bitiş tarihinin gün sonunu al
                  const end = new Date(endDate);
                  end.setHours(23, 59, 59, 999);
                  q = query(q, where("date", "<=", Timestamp.fromDate(end)));
            }

            // Tür Filtresi
            if (type && type !== 'ALL') {
                  q = query(q, where("type", "==", type));
            }

            // Durum Filtresi
            if (status && status !== 'ALL') {
                  q = query(q, where("status", "==", status));
            }

            const querySnapshot = await getDocs(q);
            let expenses = querySnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
            } as Expense));

            // Client-side soft delete filtresi
            if (showDeleted) {
                  expenses = expenses.filter(e => e.isDeleted === true);
            } else {
                  expenses = expenses.filter(e => !e.isDeleted);
            }

            return expenses;
      } catch (error) {
            console.error("Error fetching expenses:", error);
            throw error;
      }
};

export const createExpense = async (
      data: ExpenseFormData,
      user?: { uid: string; email?: string | null; displayName?: string | null }
): Promise<string> => {
      try {
            let receiptUrl = "";

            if (data.receiptFile) {
                  receiptUrl = await uploadReceipt(data.receiptFile);
            }

            const expenseData: Omit<Expense, "id"> = {
                  amount: Number(data.amount),
                  description: data.description,
                  date: Timestamp.fromDate(data.date),
                  type: data.type,
                  status: data.status,
                  ownerId: data.ownerId,
                  currency: data.currency,
                  paymentMethod: data.paymentMethod,
                  projectId: data.projectId,
                  category: data.category,
                  receiptUrl,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                  // User Info
                  createdBy: user?.uid,
                  createdByEmail: user?.email || undefined,
                  createdByDisplayName: user?.displayName || undefined,
                  isDeleted: false
            };

            const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), expenseData);
            return docRef.id;
      } catch (error) {
            console.error("Error creating expense:", error);
            throw error;
      }
};

export const updateExpense = async (
      id: string,
      data: Partial<ExpenseFormData>,
      user?: { uid: string; email?: string | null; displayName?: string | null }
): Promise<void> => {
      try {
            const expenseRef = doc(db, EXPENSES_COLLECTION, id);
            const expenseSnap = await getDoc(expenseRef);

            if (!expenseSnap.exists()) {
                  throw new Error("Expense not found");
            }

            const currentData = { id: expenseSnap.id, ...expenseSnap.data() } as Expense;

            // History Kaydı
            if (user) {
                  await addExpenseHistoryEntry(id, currentData, user, "UPDATE");
            }

            const updates: any = {
                  updatedAt: serverTimestamp(),
                  updatedBy: user?.uid,
                  updatedByEmail: user?.email,
                  updatedByDisplayName: user?.displayName
            };

            if (data.amount !== undefined) updates.amount = Number(data.amount);
            if (data.description !== undefined) updates.description = data.description;
            if (data.date !== undefined) updates.date = Timestamp.fromDate(data.date);
            if (data.type !== undefined) updates.type = data.type;
            if (data.status !== undefined) updates.status = data.status;
            if (data.ownerId !== undefined) updates.ownerId = data.ownerId;
            if (data.currency !== undefined) updates.currency = data.currency;
            if (data.paymentMethod !== undefined) updates.paymentMethod = data.paymentMethod;
            if (data.projectId !== undefined) updates.projectId = data.projectId;
            if (data.category !== undefined) updates.category = data.category;

            if (data.receiptFile) {
                  const receiptUrl = await uploadReceipt(data.receiptFile);
                  updates.receiptUrl = receiptUrl;
            }

            await updateDoc(expenseRef, updates);
      } catch (error) {
            console.error("Error updating expense:", error);
            throw error;
      }
};

// SOFT DELETE
export const deleteExpense = async (
      id: string,
      user?: { uid: string; email?: string | null; displayName?: string | null }
): Promise<void> => {
      try {
            const expenseRef = doc(db, EXPENSES_COLLECTION, id);
            const expenseSnap = await getDoc(expenseRef);

            if (!expenseSnap.exists()) {
                  throw new Error("Expense not found");
            }

            const currentData = { id: expenseSnap.id, ...expenseSnap.data() } as Expense;

            // History Kaydı
            if (user) {
                  await addExpenseHistoryEntry(id, currentData, user, "DELETE");
            }

            // Soft Delete Update
            await updateDoc(expenseRef, {
                  isDeleted: true,
                  deletedAt: serverTimestamp(),
                  deletedByUserId: user?.uid,
                  deletedByEmail: user?.email,
                  deletedByDisplayName: user?.displayName,
                  updatedAt: serverTimestamp(),
                  updatedBy: user?.uid
            });

      } catch (error) {
            console.error("Error deleting expense:", error);
            throw error;
      }
};

// HARD DELETE (ADMIN ONLY)
export const hardDeleteExpense = async (id: string): Promise<void> => {
      try {
            const expenseRef = doc(db, EXPENSES_COLLECTION, id);
            await deleteDoc(expenseRef);
            // TODO: History koleksiyonunu ve Storage dosyasını da silebiliriz.
      } catch (error) {
            console.error("Error hard deleting expense:", error);
            throw error;
      }
};

// REVERT (History'den geri alma)
export const revertExpense = async (
      expenseId: string,
      targetHistoryEntry: ExpenseHistoryEntry,
      user: { uid: string; email?: string | null; displayName?: string | null }
): Promise<void> => {
      try {
            const expenseRef = doc(db, EXPENSES_COLLECTION, expenseId);
            const expenseSnap = await getDoc(expenseRef);
            const currentData = { id: expenseSnap.id, ...expenseSnap.data() } as Expense;

            // Revert işlemi de bir değişikliktir, history'ye ekle
            await addExpenseHistoryEntry(expenseId, currentData, user, "REVERT");

            // Previous Data'yı geri yükle
            const dataToRestore = targetHistoryEntry.previousData;

            // Timestamp alanlarını düzelt (Firestore'dan gelen veri Timestamp olabilir, ama Expense tipinde Date bekleyen yerler olabilir, burada direkt Timestamp kaydediyoruz)
            // dataToRestore içindeki id, createdAt, updatedAt gibi alanları yönetmek gerekebilir.
            // Genellikle ID değişmez, createdAt değişmez. UpdatedAt güncellenir.

            const { id, createdAt, updatedAt, ...rest } = dataToRestore;

            await updateDoc(expenseRef, {
                  ...rest,
                  updatedAt: serverTimestamp(),
                  updatedBy: user.uid,
                  updatedByEmail: user.email,
                  updatedByDisplayName: user.displayName,
                  // Eğer silinmiş bir kaydı geri alıyorsak, isDeleted false olmalı (previousData'da false ise)
            });

      } catch (error) {
            console.error("Error reverting expense:", error);
            throw error;
      }
}

const uploadReceipt = async (file: File): Promise<string> => {
      try {
            const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
      } catch (error) {
            console.error("Error uploading receipt:", error);
            throw error;
      }
};
