import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  InputAdornment,
  Alert,
} from '@mui/material';
import type { Partner, PartnerFormData } from '../types/Partner';
import { createPartner, updatePartner } from '../services/partners';
import { useAuth } from '../context/AuthContext';

interface PartnerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partner?: Partner | null; // Düzenleme için mevcut ortak
}

const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  partner,
}) => {
  const { currentUserAuth } = useAuth();
  const isEditing = !!partner;

  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    sharePercentage: 0,
    baseSalary: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Partner değiştiğinde formu doldur
  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name,
        sharePercentage: partner.sharePercentage,
        baseSalary: partner.baseSalary,
      });
    } else {
      setFormData({
        name: '',
        sharePercentage: 0,
        baseSalary: 0,
      });
    }
    setError(null);
  }, [partner, open]);

  const handleChange = (field: keyof PartnerFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'name' ? e.target.value : Number(e.target.value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validasyon
    if (!formData.name.trim()) {
      setError('Ortak adı zorunludur.');
      return;
    }
    if (formData.sharePercentage < 0 || formData.sharePercentage > 100) {
      setError('Hisse oranı 0 ile 100 arasında olmalıdır.');
      return;
    }
    if (formData.baseSalary < 0) {
      setError('Maaş negatif olamaz.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userData = currentUserAuth
        ? {
            uid: currentUserAuth.uid,
            email: currentUserAuth.email || '',
            displayName: currentUserAuth.displayName || '',
          }
        : undefined;

      if (isEditing && partner) {
        await updatePartner(partner.id, formData, userData);
      } else {
        await createPartner(formData, userData);
      }

      onSuccess();
    } catch (err) {
      console.error('Ortak kaydedilirken hata:', err);
      setError('Ortak kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Ortak Düzenle' : 'Yeni Ortak Ekle'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Ortak Adı"
            value={formData.name}
            onChange={handleChange('name')}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label="Hisse Oranı"
            type="number"
            value={formData.sharePercentage}
            onChange={handleChange('sharePercentage')}
            fullWidth
            required
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{ min: 0, max: 100, step: 1 }}
          />

          <TextField
            label="Aylık Maaş"
            type="number"
            value={formData.baseSalary}
            onChange={handleChange('baseSalary')}
            fullWidth
            required
            InputProps={{
              endAdornment: <InputAdornment position="end">₺</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 100 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartnerFormModal;
