import { Timestamp } from "firebase/firestore";

// History Entry for Network
export interface NetworkHistoryEntry {
      id: string;
      contactId: string;
      previousData: NetworkContact;
      changedAt: Timestamp;
      changedByUserId: string;
      changedByEmail?: string;
      changedByDisplayName?: string;
      changeType: "UPDATE" | "DELETE" | "REVERT";
}

// Network Contact - İş bağlantıları / CRM
export interface NetworkContact {
      id: string;
      
      // Firma Bilgileri
      companyName: string;        // Firma Adı
      contactPerson: string;      // İlgili Kişi
      phone?: string;             // Telefon
      email?: string;             // E-posta
      
      // Kategorilendirme
      category: NetworkCategory;  // Yeni İnşa, Tamir, Yat, Askeri Proje, Tanker
      serviceArea?: ServiceArea;  // Boru, Boru Techiz, vb.
      shipType?: string;          // Gemi Tipi (Tanker, Tamir gemisi, vb.)
      
      // Durum Takibi
      contactStatus: ContactStatus;      // Ulaşıldı, Ulaşılmıyor, vb.
      quoteStatus: QuoteStatus;          // Teklif Verildi mi?
      quoteDate?: Timestamp;             // Teklif Tarihi
      result?: ResultStatus;             // Sonuç
      
      // Notlar
      notes?: string;
      
      // Audit
      createdAt: Timestamp;
      updatedAt: Timestamp;
      createdBy?: string;
      createdByEmail?: string;
      updatedBy?: string;
      updatedByEmail?: string;
      
      // Soft delete
      isDeleted?: boolean;
      deletedAt?: Timestamp;
}

export type NetworkCategory = 
      | 'YENI_INSA'      // Yeni İnşa
      | 'TAMIR'          // Tamir
      | 'YAT'            // Yat
      | 'ASKERI_PROJE'   // Askeri Proje
      | 'TANKER'         // Tanker
      | 'DIGER';         // Diğer

export type ServiceArea = 
      | 'BORU'           // Boru
      | 'BORU_TECHIZ'    // Boru Techiz
      | 'DIGER';         // Diğer

export type ContactStatus = 
      | 'ULASILDI'       // Ulaşıldı
      | 'ULASILMIYOR'    // Ulaşılmıyor
      | 'BEKLEMEDE';     // Beklemede

export type QuoteStatus = 
      | 'HAYIR'                    // Teklif verilmedi
      | 'TEKLIF_BEKLENIYOR'        // Teklif için bekleniyor
      | 'TEKLIF_VERILDI'           // Teklif verildi
      | 'TEKLIF_VERILECEK'         // Teklif verilecek
      | 'GORUSME_DEVAM_EDIYOR';    // Görüşme devam ediyor

export type ResultStatus = 
      | 'BEKLEMEDE'      // Beklemede
      | 'KAZANILDI'      // Kazanıldı
      | 'RED'            // Red
      | 'IS_YOK'         // İş yok
      | 'DONUS_YOK';     // Dönüş yok

export interface NetworkContactFormData {
      companyName: string;
      contactPerson: string;
      phone?: string;
      email?: string;
      category: NetworkCategory;
      serviceArea?: ServiceArea;
      shipType?: string;
      contactStatus: ContactStatus;
      quoteStatus: QuoteStatus;
      quoteDate?: Date;
      result?: ResultStatus;
      notes?: string;
}

// Helper functions for labels
export const getCategoryLabel = (category: NetworkCategory): string => {
      const labels: Record<NetworkCategory, string> = {
            'YENI_INSA': 'Yeni İnşa',
            'TAMIR': 'Tamir',
            'YAT': 'Yat',
            'ASKERI_PROJE': 'Askeri Proje',
            'TANKER': 'Tanker',
            'DIGER': 'Diğer',
      };
      return labels[category] || category;
};

export const getServiceAreaLabel = (area: ServiceArea): string => {
      const labels: Record<ServiceArea, string> = {
            'BORU': 'Boru',
            'BORU_TECHIZ': 'Boru Techiz',
            'DIGER': 'Diğer',
      };
      return labels[area] || area;
};

export const getContactStatusLabel = (status: ContactStatus): string => {
      const labels: Record<ContactStatus, string> = {
            'ULASILDI': 'Ulaşıldı',
            'ULASILMIYOR': 'Ulaşılmıyor',
            'BEKLEMEDE': 'Beklemede',
      };
      return labels[status] || status;
};

export const getQuoteStatusLabel = (status: QuoteStatus): string => {
      const labels: Record<QuoteStatus, string> = {
            'HAYIR': 'Hayır',
            'TEKLIF_BEKLENIYOR': 'Teklif Bekleniyor',
            'TEKLIF_VERILDI': 'Teklif Verildi',
            'TEKLIF_VERILECEK': 'Teklif Verilecek',
            'GORUSME_DEVAM_EDIYOR': 'Görüşme Devam Ediyor',
      };
      return labels[status] || status;
};

export const getResultStatusLabel = (status: ResultStatus): string => {
      const labels: Record<ResultStatus, string> = {
            'BEKLEMEDE': 'Beklemede',
            'KAZANILDI': 'Kazanıldı',
            'RED': 'Red',
            'IS_YOK': 'İş Yok',
            'DONUS_YOK': 'Dönüş Yok',
      };
      return labels[status] || status;
};
