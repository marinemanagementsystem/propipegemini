/**
 * Ortakları ve örnek dönem verilerini Firebase'e ekleyen script
 * Bu script tarayıcı üzerinden çalışır - Firebase Auth ile giriş yapılmış olmalı
 * 
 * Kullanım: Tarayıcı konsolunda çalıştır (F12 -> Console)
 */

// Bu kodu tarayıcı konsolunda çalıştırmak için:
// 1. http://localhost:5174 adresine git
// 2. Admin olarak giriş yap (admin@ps.com / admin123)
// 3. F12 ile Developer Tools aç
// 4. Console sekmesine git
// 5. Aşağıdaki kodu yapıştır ve Enter'a bas

const seedPartnersData = `
// Firebase modüllerini window'dan al (Vite uygulama yüklüyse mevcut)
const { getFirestore, collection, addDoc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
const { getApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');

// Mevcut Firebase app'i al
const app = getApp();
const db = getFirestore(app);

const now = Timestamp.now();

console.log('🚀 Ortaklar ekleniyor...');

// 1. Ortakları ekle
const partners = [
  {
    name: 'Ömer',
    sharePercentage: 40,
    baseSalary: 100000,
    currentBalance: 74578,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: 'Burak', 
    sharePercentage: 40,
    baseSalary: 0,
    currentBalance: 56008,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    name: 'Kazım',
    sharePercentage: 20,
    baseSalary: 50000,
    currentBalance: -130586,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

const partnerIds = {};

for (const partner of partners) {
  const docRef = await addDoc(collection(db, 'partners'), partner);
  partnerIds[partner.name] = docRef.id;
  console.log('✅ Ortak eklendi:', partner.name, '- ID:', docRef.id);
}

console.log('\\n🚀 Dönem kayıtları ekleniyor...');

// 2. Haziran 2025 dönemleri
const haziran2025 = [
  {
    partnerId: partnerIds['Ömer'],
    month: 6,
    year: 2025,
    status: 'CLOSED',
    previousBalance: 0,
    personalExpenseReimbursement: 33250,
    monthlySalary: 100000,
    profitShare: 13972,
    actualWithdrawn: 160000,
    nextMonthBalance: 12778, // 0 + 160000 - (33250 + 100000 + 13972) = 12778
    note: 'Haziran 2025',
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
    profitShare: 115792,
    actualWithdrawn: 160000,
    nextMonthBalance: 42388, // 0 + 160000 - (1820 + 0 + 115792) = 42388
    note: 'Haziran 2025',
    createdAt: now,
    updatedAt: now,
  },
  {
    partnerId: partnerIds['Kazım'],
    month: 6,
    year: 2025,
    status: 'CLOSED',
    previousBalance: 0,
    personalExpenseReimbursement: 100000,
    monthlySalary: 50000,
    profitShare: 6986,
    actualWithdrawn: 100000,
    nextMonthBalance: -56986, // 0 + 100000 - (100000 + 50000 + 6986) = -56986
    note: 'Haziran 2025',
    createdAt: now,
    updatedAt: now,
  },
];

for (const stmt of haziran2025) {
  await addDoc(collection(db, 'partner_statements'), stmt);
  console.log('✅ Haziran 2025 eklendi');
}

// 3. Temmuz 2025 dönemleri  
const temmuz2025 = [
  {
    partnerId: partnerIds['Ömer'],
    month: 7,
    year: 2025,
    status: 'CLOSED',
    previousBalance: 12778,
    personalExpenseReimbursement: 0,
    monthlySalary: 0,
    profitShare: 247200,
    actualWithdrawn: 309000,
    nextMonthBalance: 74578, // 12778 + 309000 - (0 + 0 + 247200) = 74578
    note: 'Temmuz 2025 - Ek Hakediş (618.000 TRY)',
    createdAt: now,
    updatedAt: now,
  },
  {
    partnerId: partnerIds['Burak'],
    month: 7,
    year: 2025,
    status: 'CLOSED',
    previousBalance: 42388,
    personalExpenseReimbursement: 0,
    monthlySalary: 0,
    profitShare: 247200,
    actualWithdrawn: 259000,
    nextMonthBalance: 54188, // 42388 + 259000 - (0 + 0 + 247200) = 54188
    note: 'Temmuz 2025 - Ek Hakediş (618.000 TRY)',
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
    profitShare: 123600,
    actualWithdrawn: 50000,
    nextMonthBalance: -130586, // -56986 + 50000 - (0 + 0 + 123600) = -130586
    note: 'Temmuz 2025 - Ek Hakediş (618.000 TRY)',
    createdAt: now,
    updatedAt: now,
  },
];

for (const stmt of temmuz2025) {
  await addDoc(collection(db, 'partner_statements'), stmt);
  console.log('✅ Temmuz 2025 eklendi');
}

console.log('\\n✅ TÜM VERİLER BAŞARIYLA EKLENDİ!');
console.log('\\n📊 Özet:');
console.log('- 3 Ortak: Ömer (%40), Burak (%40), Kazım (%20)');
console.log('- 6 Dönem kaydı (Haziran + Temmuz 2025)');
console.log('\\n💰 Güncel Bakiyeler:');
console.log('  Ömer: +74.578 TRY (Fazla alınan)');
console.log('  Burak: +54.188 TRY (Fazla alınan)');
console.log('  Kazım: -130.586 TRY (Eksik alınan)');
console.log('\\n🔄 Sayfayı yenile (F5) ve verileri gör!');
`;

console.log('='.repeat(60));
console.log('ORTAK VERİLERİ EKLEME SCRIPTİ');
console.log('='.repeat(60));
console.log('');
console.log('Bu script\'i çalıştırmak için:');
console.log('1. Tarayıcıda http://localhost:5174 adresine git');
console.log('2. admin@ps.com / admin123 ile giriş yap');
console.log('3. F12 -> Console sekmesine git');
console.log('4. Aşağıdaki kodu kopyala ve yapıştır:');
console.log('');
console.log('-'.repeat(60));
console.log(seedPartnersData);
console.log('-'.repeat(60));
