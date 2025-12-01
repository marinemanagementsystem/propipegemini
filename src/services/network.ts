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
      limit,
} from "firebase/firestore";
import { db } from "../firebase";
import type { NetworkContact, NetworkContactFormData, NetworkHistoryEntry } from "../types/Network";

const NETWORK_COLLECTION = "network_contacts";

// --- Helper: Add History Entry ---
export const addNetworkHistoryEntry = async (
      contactId: string,
      previousData: NetworkContact,
      user: { uid: string; email?: string | null; displayName?: string | null },
      changeType: "UPDATE" | "DELETE" | "REVERT"
): Promise<void> => {
      try {
            const historyRef = collection(db, NETWORK_COLLECTION, contactId, "history");
            const historyEntry = {
                  contactId,
                  previousData,
                  changedAt: Timestamp.now(),
                  changedByUserId: user.uid,
                  changedByEmail: user.email || null,
                  changedByDisplayName: user.displayName || null,
                  changeType
            };
            await addDoc(historyRef, historyEntry);
      } catch (error) {
            console.error("Error adding network history entry:", error);
      }
};

// --- Helper: Get History ---
export const getNetworkHistory = async (contactId: string): Promise<NetworkHistoryEntry[]> => {
      try {
            const historyRef = collection(db, NETWORK_COLLECTION, contactId, "history");
            const q = query(historyRef, orderBy("changedAt", "desc"), limit(10));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
            } as NetworkHistoryEntry));
      } catch (error) {
            console.error("Error fetching network history:", error);
            return [];
      }
};

// Get all network contacts
export const getNetworkContacts = async (showDeleted: boolean = false): Promise<NetworkContact[]> => {
      try {
            let q;
            if (showDeleted) {
                  q = query(
                        collection(db, NETWORK_COLLECTION),
                        where("isDeleted", "==", true),
                        orderBy("companyName", "asc")
                  );
            } else {
                  q = query(
                        collection(db, NETWORK_COLLECTION),
                        where("isDeleted", "in", [false, null]),
                        orderBy("companyName", "asc")
                  );
            }
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NetworkContact));
      } catch (error) {
            // Fallback without isDeleted filter if index doesn't exist
            console.warn("Falling back to simple query:", error);
            const q = query(collection(db, NETWORK_COLLECTION), orderBy("companyName", "asc"));
            const snapshot = await getDocs(q);
            const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NetworkContact));
            return showDeleted 
                  ? contacts.filter(c => c.isDeleted === true)
                  : contacts.filter(c => !c.isDeleted);
      }
};

// Get single contact by ID
export const getNetworkContactById = async (id: string): Promise<NetworkContact | null> => {
      try {
            const docRef = doc(db, NETWORK_COLLECTION, id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                  return { id: snapshot.id, ...snapshot.data() } as NetworkContact;
            }
            return null;
      } catch (error) {
            console.error("Error fetching network contact:", error);
            throw error;
      }
};

// Create new contact
export const createNetworkContact = async (
      data: NetworkContactFormData,
      user?: { uid: string; email?: string | null; displayName?: string | null }
): Promise<string> => {
      try {
            // Build document data, excluding undefined values (Firebase doesn't accept undefined)
            const docData: Record<string, any> = {
                  companyName: data.companyName,
                  contactPerson: data.contactPerson,
                  category: data.category,
                  contactStatus: data.contactStatus,
                  quoteStatus: data.quoteStatus,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  isDeleted: false,
            };

            // Only add optional fields if they have values
            if (data.phone) docData.phone = data.phone;
            if (data.email) docData.email = data.email;
            if (data.serviceArea) docData.serviceArea = data.serviceArea;
            if (data.shipType) docData.shipType = data.shipType;
            if (data.quoteDate) docData.quoteDate = Timestamp.fromDate(data.quoteDate);
            if (data.result) docData.result = data.result;
            if (data.notes) docData.notes = data.notes;
            if (user?.uid) docData.createdBy = user.uid;
            if (user?.email) docData.createdByEmail = user.email;

            const docRef = await addDoc(collection(db, NETWORK_COLLECTION), docData);
            return docRef.id;
      } catch (error) {
            console.error("Error creating network contact:", error);
            throw error;
      }
};

// Update contact
export const updateNetworkContact = async (
      id: string,
      data: Partial<NetworkContactFormData>,
      user?: { uid: string; email?: string | null; displayName?: string | null }
): Promise<void> => {
      try {
            const docRef = doc(db, NETWORK_COLLECTION, id);
            
            // Get previous data for history
            if (user) {
                  const previousDoc = await getDoc(docRef);
                  if (previousDoc.exists()) {
                        const previousData = { id: previousDoc.id, ...previousDoc.data() } as NetworkContact;
                        await addNetworkHistoryEntry(id, previousData, user, "UPDATE");
                  }
            }
            
            const updateData: Record<string, any> = {
                  updatedAt: serverTimestamp(),
            };

            // Only update fields that are provided
            if (data.companyName !== undefined) updateData.companyName = data.companyName;
            if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
            if (data.phone !== undefined) updateData.phone = data.phone || null;
            if (data.email !== undefined) updateData.email = data.email || null;
            if (data.category !== undefined) updateData.category = data.category;
            if (data.serviceArea !== undefined) updateData.serviceArea = data.serviceArea || null;
            if (data.shipType !== undefined) updateData.shipType = data.shipType || null;
            if (data.contactStatus !== undefined) updateData.contactStatus = data.contactStatus;
            if (data.quoteStatus !== undefined) updateData.quoteStatus = data.quoteStatus;
            if (data.result !== undefined) updateData.result = data.result || null;
            if (data.notes !== undefined) updateData.notes = data.notes || null;
            if (data.quoteDate !== undefined) {
                  updateData.quoteDate = data.quoteDate ? Timestamp.fromDate(data.quoteDate) : null;
            }
            
            if (user?.uid) updateData.updatedBy = user.uid;
            if (user?.email) updateData.updatedByEmail = user.email;
            if (user?.displayName) updateData.updatedByDisplayName = user.displayName;

            await updateDoc(docRef, updateData);
      } catch (error) {
            console.error("Error updating network contact:", error);
            throw error;
      }
};

// Soft delete contact
export const deleteNetworkContact = async (
      id: string,
      user?: { uid: string; email?: string | null; displayName?: string | null }
): Promise<void> => {
      try {
            const docRef = doc(db, NETWORK_COLLECTION, id);
            
            // Get previous data for history
            if (user) {
                  const previousDoc = await getDoc(docRef);
                  if (previousDoc.exists()) {
                        const previousData = { id: previousDoc.id, ...previousDoc.data() } as NetworkContact;
                        await addNetworkHistoryEntry(id, previousData, user, "DELETE");
                  }
            }
            
            await updateDoc(docRef, {
                  isDeleted: true,
                  deletedAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  updatedBy: user?.uid || null,
                  updatedByEmail: user?.email || null,
                  updatedByDisplayName: user?.displayName || null,
            });
      } catch (error) {
            console.error("Error deleting network contact:", error);
            throw error;
      }
};

// Restore soft-deleted contact
export const restoreNetworkContact = async (
      id: string,
      user?: { uid: string; email?: string | null; displayName?: string | null }
): Promise<void> => {
      try {
            const docRef = doc(db, NETWORK_COLLECTION, id);
            
            // Get previous data for history
            if (user) {
                  const previousDoc = await getDoc(docRef);
                  if (previousDoc.exists()) {
                        const previousData = { id: previousDoc.id, ...previousDoc.data() } as NetworkContact;
                        await addNetworkHistoryEntry(id, previousData, user, "REVERT");
                  }
            }
            
            await updateDoc(docRef, {
                  isDeleted: false,
                  deletedAt: null,
                  updatedAt: serverTimestamp(),
                  updatedBy: user?.uid || null,
                  updatedByEmail: user?.email || null,
                  updatedByDisplayName: user?.displayName || null,
            });
      } catch (error) {
            console.error("Error restoring network contact:", error);
            throw error;
      }
};

// Hard delete contact (permanent)
export const hardDeleteNetworkContact = async (id: string): Promise<void> => {
      try {
            const docRef = doc(db, NETWORK_COLLECTION, id);
            await deleteDoc(docRef);
      } catch (error) {
            console.error("Error hard deleting network contact:", error);
            throw error;
      }
};
