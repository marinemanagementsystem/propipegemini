import { Timestamp } from "firebase/firestore";

// 1.A) Collection: projects (Shipyards)
export interface Project {
      id: string;
      name: string;           // e.g. "SANMAR", "SEFİNE"
      location: string;       // e.g. "Tuzla", "Yalova"
      currentBalance: number; // The rolling balance currently held inside this shipyard

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

// 1.B) Collection: project_statements (Hakediş Dosyaları)
export interface ProjectStatement {
      id: string;
      projectId: string; // Reference to `projects/{id}`

      title: string;     // e.g. "Temmuz 1. Ara Hakediş"
      date: Timestamp;   // Date of the statement

      status: "DRAFT" | "CLOSED";

      totals: {
            totalIncome: number;        // sum of income lines
            totalExpensePaid: number;   // sum of EXPENSE lines where isPaid = true
            totalExpenseUnpaid: number; // sum of EXPENSE lines where isPaid = false
            netCashReal: number;        // totalIncome - totalExpensePaid
      };

      previousBalance: number; // Amount carried over from previous statements
      finalBalance: number;    // previousBalance + totals.netCashReal

      transferAction: "NONE" | "TRANSFERRED_TO_SAFE" | "CARRIED_OVER";

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

// 1.C) Sub-Collection: statement_lines
export interface StatementLine {
      id: string;
      statementId: string;

      direction: "INCOME" | "EXPENSE";
      category: string;             // e.g. "PROGRESS_PAYMENT", "SALARY", "SUPPLIER"
      amount: number;
      isPaid: boolean;              // true = realized, false = forecast
      description: string;

      relatedExpenseId?: string;    // optional link to an expense document
      partnerId?: string;           // optional for partner-related distributions
      paidAt?: Timestamp;

      createdAt: Timestamp;
      updatedAt: Timestamp;
}
