import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

// User data to create
const usersToCreate = [
      {
            email: 'admin@ps.com',
            password: 'admin123',
            displayName: 'Admin',
            role: 'super_admin',
      },
      {
            email: 'ok@ps.com',
            password: '12345678',
            displayName: 'OK',
            role: 'user',
      },
      {
            email: 'bc@ps.com',
            password: '12345678',
            displayName: 'BC',
            role: 'user',
      },
      {
            email: 'kk@ps.com',
            password: '12345678',
            displayName: 'KK',
            role: 'user',
      },
];

export const createUsers = async () => {
      const results: { email: string; success: boolean; error?: string }[] = [];

      for (const userData of usersToCreate) {
            try {
                  // Create user in Firebase Auth
                  const userCredential = await createUserWithEmailAndPassword(
                        auth,
                        userData.email,
                        userData.password
                  );

                  // Create user profile in Firestore
                  await setDoc(doc(db, 'users', userCredential.user.uid), {
                        email: userData.email,
                        displayName: userData.displayName,
                        role: userData.role,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                  });

                  results.push({ email: userData.email, success: true });
                  console.log(`✅ Created user: ${userData.email}`);
            } catch (error: any) {
                  // User might already exist
                  if (error.code === 'auth/email-already-in-use') {
                        results.push({ email: userData.email, success: false, error: 'Already exists' });
                        console.log(`⚠️ User already exists: ${userData.email}`);
                  } else {
                        results.push({ email: userData.email, success: false, error: error.message });
                        console.error(`❌ Error creating ${userData.email}:`, error.message);
                  }
            }
      }

      return results;
};

export default createUsers;
