import {
      collection,
      addDoc,
      updateDoc,
      deleteDoc,
      doc,
      getDocs,
      query,
      orderBy,
      Timestamp,
      where,
      QueryConstraint
} from "firebase/firestore";
import {
      ref,
      uploadBytes,
      getDownloadURL
} from "firebase/storage";
import { db, storage } from "../firebase";
import type { Expense, ExpenseFormData } from "../types/Expense";

const EXPENSES_COLLECTION = "expenses";

export const getExpenses = async (
      startDate?: Date | null,
      endDate?: Date | null,
      type?: string,
      status?: string
): Promise<Expense[]> => {
      const constraints: QueryConstraint[] = [orderBy("date", "desc")];

      if (startDate) {
            constraints.push(where("date", ">=", Timestamp.fromDate(startDate)));
      }
      if (endDate) {
            // End date should be end of the day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            constraints.push(where("date", "<=", Timestamp.fromDate(end)));
      }
      if (type && type !== "ALL") {
            constraints.push(where("type", "==", type));
      }
      if (status && status !== "ALL") {
            constraints.push(where("status", "==", status));
      }

      const q = query(collection(db, EXPENSES_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
      })) as Expense[];
};

export const createExpense = async (data: ExpenseFormData): Promise<string> => {
      let receiptUrl = "";

      const expenseData = {
            amount: Number(data.amount),
            description: data.description,
            date: Timestamp.fromDate(data.date),
            type: data.type,
            status: data.status,
            ownerId: data.ownerId,
            currency: data.currency,
            paymentMethod: data.paymentMethod,
            projectId: data.projectId || null,
            category: data.category || null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            receiptUrl: ""
      };

      const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), expenseData);
      const expenseId = docRef.id;

      if (data.receiptFile) {
            const storageRef = ref(storage, `receipts/${expenseId}/${data.receiptFile.name}`);
            await uploadBytes(storageRef, data.receiptFile);
            receiptUrl = await getDownloadURL(storageRef);

            await updateDoc(doc(db, EXPENSES_COLLECTION, expenseId), {
                  receiptUrl: receiptUrl
            });
      }

      return expenseId;
};

export const updateExpense = async (id: string, data: Partial<ExpenseFormData>): Promise<void> => {
      const updateData: any = {
            updatedAt: Timestamp.now()
      };

      if (data.amount !== undefined) updateData.amount = Number(data.amount);
      if (data.description !== undefined) updateData.description = data.description;
      if (data.date !== undefined) updateData.date = Timestamp.fromDate(data.date);
      if (data.type !== undefined) updateData.type = data.type;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
      if (data.projectId !== undefined) updateData.projectId = data.projectId;
      if (data.category !== undefined) updateData.category = data.category;

      if (data.receiptFile) {
            const storageRef = ref(storage, `receipts/${id}/${data.receiptFile.name}`);
            await uploadBytes(storageRef, data.receiptFile);
            const newUrl = await getDownloadURL(storageRef);
            updateData.receiptUrl = newUrl;
      }

      await updateDoc(doc(db, EXPENSES_COLLECTION, id), updateData);
};

export const deleteExpense = async (id: string): Promise<void> => {
      await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
      // TODO: Delete file from storage if receiptUrl exists
};
