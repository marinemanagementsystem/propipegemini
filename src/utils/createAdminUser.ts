import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import type { UserRole } from "../types/Expense";

export const createDefaultAdmin = async () => {
      const email = "admin@propipe.com";
      const password = "admin123";

      try {
            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create Firestore Profile
            await setDoc(doc(db, "users", user.uid), {
                  id: user.uid,
                  email: user.email,
                  displayName: "Admin Kullanıcı",
                  role: "ADMIN" as UserRole,
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now()
            });

            return { success: true, message: "Admin kullanıcısı başarıyla oluşturuldu. Giriş yapabilirsiniz." };
      } catch (error: any) {
            console.error("Error creating admin:", error);
            if (error.code === 'auth/email-already-in-use') {
                  return { success: false, message: "Bu e-posta adresi zaten kullanımda. Lütfen direkt giriş yapmayı deneyin." };
            }
            return { success: false, message: "Hata: " + error.message };
      }
};
