// Script to create users via Firebase REST API
// Run with: node scripts/createUsersScript.mjs

const FIREBASE_API_KEY = 'AIzaSyDbGjgJiqQMOqRsMmSrZGJtWKw0GXRBESM';
const FIREBASE_PROJECT_ID = 'propipegemini';

const users = [
      { email: 'admin@ps.com', password: 'admin123', displayName: 'Admin', role: 'super_admin' },
      { email: 'ok@ps.com', password: '12345678', displayName: 'OK', role: 'user' },
      { email: 'bc@ps.com', password: '12345678', displayName: 'BC', role: 'user' },
      { email: 'kk@ps.com', password: '12345678', displayName: 'KK', role: 'user' },
];

async function createUser(userData) {
      try {
            // Create user in Firebase Auth
            const authResponse = await fetch(
                  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
                  {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                              email: userData.email,
                              password: userData.password,
                              returnSecureToken: true,
                        }),
                  }
            );

            const authData = await authResponse.json();

            if (authData.error) {
                  if (authData.error.message === 'EMAIL_EXISTS') {
                        console.log(`⚠️  ${userData.email} - Zaten mevcut`);
                        return { success: false, exists: true };
                  }
                  console.log(`❌ ${userData.email} - Hata: ${authData.error.message}`);
                  return { success: false, error: authData.error.message };
            }

            // Create user profile in Firestore
            const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${authData.localId}`;
            
            await fetch(firestoreUrl, {
                  method: 'PATCH',
                  headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authData.idToken}`,
                  },
                  body: JSON.stringify({
                        fields: {
                              email: { stringValue: userData.email },
                              displayName: { stringValue: userData.displayName },
                              role: { stringValue: userData.role },
                              createdAt: { timestampValue: new Date().toISOString() },
                              updatedAt: { timestampValue: new Date().toISOString() },
                        },
                  }),
            });

            console.log(`✅ ${userData.email} - Oluşturuldu (${userData.role})`);
            return { success: true };
      } catch (error) {
            console.log(`❌ ${userData.email} - Hata: ${error.message}`);
            return { success: false, error: error.message };
      }
}

async function main() {
      console.log('🚀 Kullanıcılar oluşturuluyor...\n');
      
      for (const user of users) {
            await createUser(user);
      }
      
      console.log('\n✨ İşlem tamamlandı!');
      console.log('\nGiriş bilgileri:');
      console.log('─────────────────────────────────────');
      users.forEach(u => {
            console.log(`📧 ${u.email} | 🔑 ${u.password} | 👤 ${u.role}`);
      });
}

main();
