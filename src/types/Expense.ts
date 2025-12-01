import { Timestamp } from "firebase/firestore";

export type ExpenseType = "COMPANY_OFFICIAL" | "PERSONAL" | "ADVANCE";
export type ExpenseStatus = "PAID" | "UNPAID";
export type Currency = "TRY" | "EUR" | "USD";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER";
export type UserRole = "ADMIN" | "ORTAK" | "MUHASEBE";

export interface UserProfile {
      id: string;
      email: string;
      displayName: string;
      role: UserRole;
      createdAt: Timestamp;
      updatedAt: Timestamp;
}

export interface ExpenseHistoryEntry {
      id: string;
      expenseId: string;
      previousData: Expense;
      changedAt: Timestamp;
      changedByUserId: string;
      changedByEmail?: string;
      changedByDisplayName?: string;
      changeType: "UPDATE" | "DELETE" | "REVERT";
}

export interface Expense {
      id: string;
      amount: number;
      description: string;
      date: Timestamp;
      type: ExpenseType;
      status: ExpenseStatus;
      ownerId: string;
      receiptUrl?: string;
      currency: Currency;
      paymentMethod: PaymentMethod;
      projectId?: string;
      category?: string;
      createdAt: Timestamp;
      updatedAt: Timestamp;

      // Audit fields
      createdBy?: string;
      createdByEmail?: string;
      createdByDisplayName?: string;

      updatedBy?: string;
      updatedByEmail?: string;
      updatedByDisplayName?: string;

      // Soft delete fields
      isDeleted?: boolean;
      deletedAt?: Timestamp | null;
      deletedByUserId?: string;
      deletedByEmail?: string;
      deletedByDisplayName?: string;
}

// Helper for form data (before saving to Firestore)
export interface ExpenseFormData {
      amount: number;
      description: string;
      date: Date;
      type: ExpenseType;
      status: ExpenseStatus;
      ownerId: string;
      currency: Currency;
      paymentMethod: PaymentMethod;
      projectId?: string;
      category?: string;
      receiptFile?: File | null;
}
