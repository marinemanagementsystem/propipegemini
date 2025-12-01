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
      writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import type { Project, ProjectStatement, StatementLine } from "../types/Project";

const PROJECTS_COLLECTION = "projects";
const STATEMENTS_COLLECTION = "project_statements";
const LINES_SUBCOLLECTION = "statement_lines";

// --- Project (Shipyard) Methods ---

export const getProjects = async (): Promise<Project[]> => {
      try {
            const q = query(collection(db, PROJECTS_COLLECTION), orderBy("name", "asc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      } catch (error) {
            console.error("Error fetching projects:", error);
            throw error;
      }
};

export const getProjectById = async (projectId: string): Promise<Project | null> => {
      try {
            const docRef = doc(db, PROJECTS_COLLECTION, projectId);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                  return { id: snapshot.id, ...snapshot.data() } as Project;
            }
            return null;
      } catch (error) {
            console.error("Error fetching project:", error);
            throw error;
      }
};

export const createProject = async (
      data: Omit<Project, "id" | "createdAt" | "updatedAt" | "currentBalance">,
      user?: { uid: string; email?: string; displayName?: string }
): Promise<string> => {
      try {
            const projectData = {
                  ...data,
                  currentBalance: 0,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  createdBy: user?.uid,
                  createdByEmail: user?.email,
                  createdByDisplayName: user?.displayName
            };
            const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
            return docRef.id;
      } catch (error) {
            console.error("Error creating project:", error);
            throw error;
      }
};

// --- Statement Methods ---

export const getStatementsByProject = async (projectId: string): Promise<ProjectStatement[]> => {
      try {
            const q = query(
                  collection(db, STATEMENTS_COLLECTION),
                  where("projectId", "==", projectId)
            );
            const snapshot = await getDocs(q);
            const statements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProjectStatement));

            // Sort by date descending (client-side to avoid index requirement)
            return statements.sort((a, b) => {
                  const getSeconds = (date: any) => {
                        if (date?.seconds) return date.seconds;
                        if (date instanceof Date) return date.getTime() / 1000;
                        return 0;
                  };
                  return getSeconds(b.date) - getSeconds(a.date);
            });
      } catch (error) {
            console.error("Error fetching statements:", error);
            throw error;
      }
};

export const getStatementById = async (statementId: string): Promise<ProjectStatement | null> => {
      try {
            const docRef = doc(db, STATEMENTS_COLLECTION, statementId);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                  return { id: snapshot.id, ...snapshot.data() } as ProjectStatement;
            }
            return null;
      } catch (error) {
            console.error("Error fetching statement:", error);
            throw error;
      }
};

export const createStatement = async (
      projectId: string,
      data: { title: string; date: Date; previousBalance: number },
      user?: { uid: string; email?: string; displayName?: string }
): Promise<string> => {
      try {
            const statementData = {
                  projectId,
                  title: data.title,
                  date: Timestamp.fromDate(data.date),
                  status: "DRAFT",
                  totals: {
                        totalIncome: 0,
                        totalExpensePaid: 0,
                        totalExpenseUnpaid: 0,
                        netCashReal: 0
                  },
                  previousBalance: data.previousBalance,
                  finalBalance: data.previousBalance, // Initially same as previous
                  transferAction: "NONE",
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  createdBy: user?.uid,
                  createdByEmail: user?.email,
                  createdByDisplayName: user?.displayName
            };
            const docRef = await addDoc(collection(db, STATEMENTS_COLLECTION), statementData);
            return docRef.id;
      } catch (error) {
            console.error("Error creating statement:", error);
            throw error;
      }
};

export const updateStatement = async (
      statementId: string,
      updates: Partial<ProjectStatement>,
      user?: { uid: string; email?: string; displayName?: string }
): Promise<void> => {
      try {
            const docRef = doc(db, STATEMENTS_COLLECTION, statementId);

            const updateData: any = {
                  ...updates,
                  updatedAt: serverTimestamp()
            };

            if (user) {
                  updateData.updatedBy = user.uid;
                  updateData.updatedByEmail = user.email;
                  updateData.updatedByDisplayName = user.displayName;
            }

            await updateDoc(docRef, updateData);
      } catch (error) {
            console.error("Error updating statement:", error);
            throw error;
      }
};

export const deleteStatement = async (statementId: string): Promise<void> => {
      try {
            const docRef = doc(db, STATEMENTS_COLLECTION, statementId);
            // TODO: Also delete all sub-collection lines? Firestore doesn't do this automatically.
            // For now, we assume this is only called for DRAFT statements with few lines.
            await deleteDoc(docRef);
      } catch (error) {
            console.error("Error deleting statement:", error);
            throw error;
      }
};

// --- Statement Lines Methods ---

export const getStatementLines = async (statementId: string): Promise<StatementLine[]> => {
      try {
            const q = query(collection(db, STATEMENTS_COLLECTION, statementId, LINES_SUBCOLLECTION));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StatementLine));
      } catch (error) {
            console.error("Error fetching lines:", error);
            throw error;
      }
};

export const createStatementLine = async (
      statementId: string,
      data: Omit<StatementLine, "id" | "statementId" | "createdAt" | "updatedAt">,
      user?: { uid: string; email?: string; displayName?: string }
): Promise<string> => {
      try {
            const lineData = {
                  ...data,
                  statementId,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, STATEMENTS_COLLECTION, statementId, LINES_SUBCOLLECTION), lineData);

            // Recalculate totals
            await recalculateStatementTotals(statementId, user);

            return docRef.id;
      } catch (error) {
            console.error("Error creating line:", error);
            throw error;
      }
};

export const updateStatementLine = async (
      statementId: string,
      lineId: string,
      updates: Partial<StatementLine>,
      user?: { uid: string; email?: string; displayName?: string }
): Promise<void> => {
      try {
            const docRef = doc(db, STATEMENTS_COLLECTION, statementId, LINES_SUBCOLLECTION, lineId);
            await updateDoc(docRef, {
                  ...updates,
                  updatedAt: serverTimestamp()
            });

            // Recalculate totals
            await recalculateStatementTotals(statementId, user);
      } catch (error) {
            console.error("Error updating line:", error);
            throw error;
      }
};

export const deleteStatementLine = async (
      statementId: string,
      lineId: string,
      user?: { uid: string; email?: string; displayName?: string }
): Promise<void> => {
      try {
            const docRef = doc(db, STATEMENTS_COLLECTION, statementId, LINES_SUBCOLLECTION, lineId);
            await deleteDoc(docRef);

            // Recalculate totals
            await recalculateStatementTotals(statementId, user);
      } catch (error) {
            console.error("Error deleting line:", error);
            throw error;
      }
};

// --- Business Logic: Recalculate Totals ---

export const recalculateStatementTotals = async (
      statementId: string,
      user?: { uid: string; email?: string; displayName?: string }
): Promise<void> => {
      try {
            const lines = await getStatementLines(statementId);

            let totalIncome = 0;
            let totalExpensePaid = 0;
            let totalExpenseUnpaid = 0;

            lines.forEach(line => {
                  if (line.direction === "INCOME") {
                        totalIncome += line.amount;
                  } else if (line.direction === "EXPENSE") {
                        if (line.isPaid) {
                              totalExpensePaid += line.amount;
                        } else {
                              totalExpenseUnpaid += line.amount;
                        }
                  }
            });

            // NEW LOGIC: Net Result = Income - (Paid + Unpaid)
            // This matches the user's Excel sheet where "Net Kasa" accounts for all expenses.
            const netCashReal = totalIncome - (totalExpensePaid + totalExpenseUnpaid);

            // Fetch current statement to get previousBalance
            const statement = await getStatementById(statementId);
            if (!statement) throw new Error("Statement not found during recalculation");

            const finalBalance = statement.previousBalance + netCashReal;

            await updateStatement(statementId, {
                  totals: {
                        totalIncome,
                        totalExpensePaid,
                        totalExpenseUnpaid,
                        netCashReal
                  },
                  finalBalance
            }, user);

      } catch (error) {
            console.error("Error recalculating totals:", error);
            throw error;
      }
};

// --- Closing Statement Logic ---

export const closeStatement = async (
      statementId: string,
      projectId: string,
      action: "TRANSFERRED_TO_SAFE" | "CARRIED_OVER"
): Promise<void> => {
      try {
            const statement = await getStatementById(statementId);
            if (!statement) throw new Error("Statement not found");

            const finalBalance = statement.finalBalance;
            const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

            const batch = writeBatch(db);

            // 1. Update Statement
            const statementRef = doc(db, STATEMENTS_COLLECTION, statementId);
            batch.update(statementRef, {
                  status: "CLOSED",
                  transferAction: action,
                  updatedAt: serverTimestamp()
            });

            // 2. Update Project Balance
            let newProjectBalance = 0;
            if (action === "CARRIED_OVER") {
                  newProjectBalance = finalBalance;
            } else if (action === "TRANSFERRED_TO_SAFE") {
                  newProjectBalance = 0;
                  // TODO: Create safe transaction record here if needed
            }

            batch.update(projectRef, {
                  currentBalance: newProjectBalance,
                  updatedAt: serverTimestamp()
            });

            await batch.commit();

      } catch (error) {
            console.error("Error closing statement:", error);
            throw error;
      }
};
