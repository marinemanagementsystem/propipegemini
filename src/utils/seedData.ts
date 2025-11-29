import type { ExpenseFormData } from "../types/Expense";

const defaultDate = new Date();

export const seedData: ExpenseFormData[] = [
      {
            amount: 200000,
            description: "Mahmut amca borç (4200 EURO)",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "UNPAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 1345000,
            description: "78+150 gram altın",
            date: new Date("2025-08-18"),
            type: "COMPANY_OFFICIAL",
            status: "UNPAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 560,
            description: "merdane toplantı",
            date: new Date("2025-09-03"),
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "BURAK BİÇER",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 3000,
            description: "veli Can siriarkalı",
            date: new Date("2025-09-04"),
            type: "ADVANCE",
            status: "PAID",
            ownerId: "BURAK BİÇER",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 2000,
            description: "eren demirer",
            date: new Date("2025-09-04"),
            type: "ADVANCE",
            status: "PAID",
            ownerId: "BURAK BİÇER",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 800,
            description: "yakıt",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 675000,
            description: "kredi(faizi gelecek)",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "UNPAID",
            ownerId: "KAZIM KIZILBAY",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 475,
            description: "Google workspace",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "KAZIM KIZILBAY",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 20376,
            description: "köprü",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 1800,
            description: "rot ayarı ve radyatör kapağı",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 3750,
            description: "yakıt",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 2200,
            description: "yemek",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 2475,
            description: "köprü",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "UNPAID",
            ownerId: "ÖMER KARATAŞ",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 500,
            description: "yemek",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "KAZIM KIZILBAY",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      },
      {
            amount: 500,
            description: "yemek",
            date: defaultDate,
            type: "COMPANY_OFFICIAL",
            status: "PAID",
            ownerId: "BURAK BİÇER",
            currency: "TRY",
            paymentMethod: "CASH",
            receiptFile: null
      }
];
