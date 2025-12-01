/**
 * Ortaklar ve aylık hesap verilerini Firebase'e ekleyen script
 * Çalıştırmak için: node scripts/seedPartners.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA3OHaXjWwJjrCefqbPi9pMxjpRdnkfaik",
  authDomain: "propipe-gemini.firebaseapp.com",
  projectId: "propipe-gemini",
  storageBucket: "propipe-gemini.firebasestorage.app",
  messagingSenderId: "296837954267",
  appId: "1:296837954267:web:6fbde21403e5fbcc4b9e6c",
  measurementId: "G-WWBD84T6WD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedPartners() {
  console.log('🚀 Ortaklar ekleniyor...');

  const now = Timestamp.now();

  // Ortakları ekle
  const partners = [
    {
      name: 'Ömer',
      sharePercentage: 40,
      baseSalary: 100000,
      currentBalance: 74578, // Son dönem sonucu
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Burak',
      sharePercentage: 40,
      baseSalary: 0, // Maaş almıyor gibi görünüyor
      currentBalance: 56008, // Son dönem sonucu
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Kazım',
      sharePercentage: 20,
      baseSalary: 50000,
      currentBalance: -130586, // Eksik (ortak şirkete borçlu)
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const partnerIds = {};

  for (const partner of partners) {
    const docRef = await addDoc(collection(db, 'partners'), partner);
    partnerIds[partner.name] = docRef.id;
    console.log(`✅ Ortak eklendi: ${partner.name} (ID: ${docRef.id})`);
  }

  console.log('\n🚀 Aylık hesap dönemleri ekleniyor...');

  // Haziran 2025 - 1. Dönem (24 Temmuz 2025 tarihli kayıt)
  const haziran2025Statements = [
    {
      partnerId: partnerIds['Ömer'],
      month: 6, // Haziran
      year: 2025,
      status: 'CLOSED',
      previousBalance: 0,
      personalExpenseReimbursement: 33250, // Haziran Hakediş Sıfırlama 2
      monthlySalary: 100000,
      profitShare: 13972, // Kalan Paranın Payı (420.000 * 0.40 - maaş sonrası)
      actualWithdrawn: 160000, // Gerçekte alınan
      nextMonthBalance: 12778, // Fazla alınan
      note: 'Haziran 2025 - 1. Dönem',
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
      profitShare: 115792, // (420.000 - 250.000 maaş) * 0.40 + sıfırlama payı
      actualWithdrawn: 160000,
      nextMonthBalance: 44208, // Fazla alınan
      note: 'Haziran 2025 - 1. Dönem',
      createdAt: now,
      updatedAt: now,
    },
    {
      partnerId: partnerIds['Kazım'],
      month: 6,
      year: 2025,
      status: 'CLOSED',
      previousBalance: 0,
      personalExpenseReimbursement: 100000, // Haziran Hakediş Sıfırlama 2
      monthlySalary: 50000,
      profitShare: 6986, // Kalan Paranın Payı
      actualWithdrawn: 100000, // Gerçekte alınan
      nextMonthBalance: -56986, // Eksik alınan
      note: 'Haziran 2025 - 1. Dönem',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const stmt of haziran2025Statements) {
    await addDoc(collection(db, 'partner_statements'), stmt);
    console.log(`✅ Haziran 2025 dönemi eklendi (Partner ID: ${stmt.partnerId})`);
  }

  // Haziran 2025 - 2. Dönem (25 Temmuz 2025 tarihli kayıt - Ek hakediş)
  const haziran2025_2Statements = [
    {
      partnerId: partnerIds['Ömer'],
      month: 7, // Temmuz olarak kaydedelim (2. dönem)
      year: 2025,
      status: 'CLOSED',
      previousBalance: 12778, // Önceki dönemden devir
      personalExpenseReimbursement: 0,
      monthlySalary: 0, // Bu dönem maaş yok
      profitShare: 247200, // 618.000 * 0.40
      actualWithdrawn: 309000,
      nextMonthBalance: 74578, // Fazla alınan
      note: 'Temmuz 2025 - Ek Hakediş Dönemi (618.000 TRY)',
      createdAt: now,
      updatedAt: now,
    },
    {
      partnerId: partnerIds['Burak'],
      month: 7,
      year: 2025,
      status: 'CLOSED',
      previousBalance: 44208,
      personalExpenseReimbursement: 0,
      monthlySalary: 0,
      profitShare: 247200, // 618.000 * 0.40
      actualWithdrawn: 259000,
      nextMonthBalance: 56008, // Fazla alınan
      note: 'Temmuz 2025 - Ek Hakediş Dönemi (618.000 TRY)',
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
      profitShare: 123600, // 618.000 * 0.20
      actualWithdrawn: 50000,
      nextMonthBalance: -130586, // Eksik alınan (ortak şirkete borçlu)
      note: 'Temmuz 2025 - Ek Hakediş Dönemi (618.000 TRY)',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const stmt of haziran2025_2Statements) {
    await addDoc(collection(db, 'partner_statements'), stmt);
    console.log(`✅ Temmuz 2025 dönemi eklendi (Partner ID: ${stmt.partnerId})`);
  }

  console.log('\n✅ Tüm veriler başarıyla eklendi!');
  console.log('\n📊 Özet:');
  console.log('- 3 Ortak: Ömer (%40), Burak (%40), Kazım (%20)');
  console.log('- 6 Dönem kaydı (Haziran + Temmuz 2025)');
  console.log('\n💰 Güncel Bakiyeler:');
  console.log('  Ömer: +74.578 TRY (Şirket ortağa borçlu)');
  console.log('  Burak: +56.008 TRY (Şirket ortağa borçlu)');
  console.log('  Kazım: -130.586 TRY (Ortak şirkete borçlu)');

  process.exit(0);
}

seedPartners().catch((error) => {
  console.error('❌ Hata:', error);
  process.exit(1);
});
