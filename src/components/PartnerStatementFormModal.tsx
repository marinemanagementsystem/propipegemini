import React, { useState, useEffect, useMemo } from 'react';
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
  MenuItem,
  Typography,
  Divider,
  Paper,
} from '@mui/material';
import type { PartnerStatement, PartnerStatementFormData } from '../types/Partner';
import { MONTH_NAMES, calculateNextMonthBalance } from '../types/Partner';
import {
  createPartnerStatement,
  updatePartnerStatement,
  getSuggestedPreviousBalance,
  checkStatementExists,
} from '../services/partners';
import { useAuth } from '../context/AuthContext';

// SUPER_ADMIN kontrolü için helper
const isSuperAdmin = (role?: string): boolean => role === 'SUPER_ADMIN';

interface PartnerStatementFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partnerId: string;
  partnerBaseSalary: number;
  statement?: PartnerStatement | null; // Düzenleme için mevcut statement
}

const PartnerStatementFormModal: React.FC<PartnerStatementFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  partnerId,
  partnerBaseSalary,
  statement,
}) => {
  const { currentUserAuth, currentUserProfile } = useAuth();
  const canEditPreviousBalance = isSuperAdmin(currentUserProfile?.role);
  const isEditing = !!statement;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [formData, setFormData] = useState<PartnerStatementFormData>({
    month: currentMonth,
    year: currentYear,
    previousBalance: 0,
    personalExpenseReimbursement: 0,
    monthlySalary: partnerBaseSalary,
    profitShare: 0,
    actualWithdrawn: 0,
    note: '',
  });
  
  const [previousBalanceEditable, setPreviousBalanceEditable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // nextMonthBalance hesapla (real-time)
  const calculatedNextMonthBalance = useMemo(() => {
    return calculateNextMonthBalance(
      formData.previousBalance,
      formData.personalExpenseReimbursement,
      formData.monthlySalary,
      formData.profitShare,
      formData.actualWithdrawn
    );
  }, [
    formData.previousBalance,
    formData.personalExpenseReimbursement,
    formData.monthlySalary,
    formData.profitShare,
    formData.actualWithdrawn,
  ]);
  const isOverdrawn = calculatedNextMonthBalance > 0;

  // Modal açıldığında formu hazırla
  useEffect(() => {
    const initializeForm = async () => {
      if (!open) return;

      if (statement) {
        // Düzenleme modu
        setFormData({
          month: statement.month,
          year: statement.year,
          previousBalance: statement.previousBalance,
          personalExpenseReimbursement: statement.personalExpenseReimbursement,
          monthlySalary: statement.monthlySalary,
          profitShare: statement.profitShare,
          actualWithdrawn: statement.actualWithdrawn,
          note: statement.note || '',
        });
        // Düzenlemede previousBalance sadece SUPER_ADMIN düzenleyebilir
        setPreviousBalanceEditable(canEditPreviousBalance);
      } else {
        // Yeni oluşturma modu
        try {
          const suggested = await getSuggestedPreviousBalance(partnerId);
          setFormData({
            month: currentMonth,
            year: currentYear,
            previousBalance: suggested.value,
            personalExpenseReimbursement: 0,
            monthlySalary: partnerBaseSalary,
            profitShare: 0,
            actualWithdrawn: 0,
            note: '',
          });
          // SUPER_ADMIN her zaman düzenleyebilir, değilse suggested.isEditable'a bak
          setPreviousBalanceEditable(canEditPreviousBalance || suggested.isEditable);
        } catch (err) {
          console.error('Devreden bakiye alınırken hata:', err);
          setFormData({
            month: currentMonth,
            year: currentYear,
            previousBalance: 0,
            personalExpenseReimbursement: 0,
            monthlySalary: partnerBaseSalary,
            profitShare: 0,
            actualWithdrawn: 0,
            note: '',
          });
          setPreviousBalanceEditable(canEditPreviousBalance || true);
        }
      }
      setError(null);
      setWarning(null);
    };

    initializeForm();
  }, [statement, open, partnerId, partnerBaseSalary, currentMonth, currentYear, canEditPreviousBalance]);

  // Ay/yıl değiştiğinde mevcut statement kontrolü
  useEffect(() => {
    const checkExisting = async () => {
      if (!open || isEditing) return;

      try {
        const exists = await checkStatementExists(partnerId, formData.month, formData.year);
        if (exists) {
          setWarning(`Bu dönem (${MONTH_NAMES[formData.month]} ${formData.year}) için zaten bir kayıt mevcut.`);
        } else {
          setWarning(null);
        }
      } catch (err) {
        console.error('Dönem kontrolü sırasında hata:', err);
      }
    };

    checkExisting();
  }, [formData.month, formData.year, partnerId, open, isEditing]);

  const handleChange = (field: keyof PartnerStatementFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'note' ? e.target.value : Number(e.target.value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validasyon
    if (formData.month < 1 || formData.month > 12) {
      setError('Geçerli bir ay seçiniz.');
      return;
    }
    if (formData.year < 2000 || formData.year > 2100) {
      setError('Geçerli bir yıl giriniz.');
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

      if (isEditing && statement) {
        await updatePartnerStatement(statement.id, formData, userData);
      } else {
        await createPartnerStatement(partnerId, formData, userData);
      }

      onSuccess();
    } catch (err) {
      console.error('Dönem kaydedilirken hata:', err);
      setError('Dönem kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Para formatla
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Yıl seçenekleri
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Dönem Satırını Düzenle' : 'Yeni Dönem Satırı Ekle'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {warning && (
            <Alert severity="warning" onClose={() => setWarning(null)}>
              {warning}
            </Alert>
          )}

          {/* Dönem Seçimi */}
          <Box display="flex" gap={2}>
            <TextField
              select
              label="Ay"
              value={formData.month}
              onChange={handleChange('month')}
              fullWidth
              disabled={isEditing}
            >
              {Object.entries(MONTH_NAMES).map(([value, label]) => (
                <MenuItem key={value} value={Number(value)}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Yıl"
              value={formData.year}
              onChange={handleChange('year')}
              fullWidth
              disabled={isEditing}
            >
              {yearOptions.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Divider />

          {/* Devreden Bakiye */}
          <TextField
            label="Devreden Bakiye"
            type="number"
            value={formData.previousBalance}
            onChange={handleChange('previousBalance')}
            fullWidth
            disabled={!previousBalanceEditable}
            helperText={
              canEditPreviousBalance
                ? 'SUPER ADMIN: Manuel düzenleme yapabilirsiniz'
                : previousBalanceEditable
                  ? 'İlk dönem için açılış bakiyesi girebilirsiniz.'
                  : 'Önceki dönemden devir (otomatik)'
            }
            InputProps={{
              endAdornment: <InputAdornment position="end">₺</InputAdornment>,
            }}
            sx={canEditPreviousBalance && previousBalanceEditable ? {
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'warning.main',
                },
              },
            } : {}}
          />

          {/* Kişisel Harcama İadesi */}
          <TextField
            label="Kişisel Harcama İadesi"
            type="number"
            value={formData.personalExpenseReimbursement}
            onChange={handleChange('personalExpenseReimbursement')}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">₺</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 100 }}
            helperText="Bu ay ödenen kişisel giderlerin toplamı"
          />

          {/* Maaş */}
          <TextField
            label="Maaş"
            type="number"
            value={formData.monthlySalary}
            onChange={handleChange('monthlySalary')}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">₺</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 100 }}
            helperText={`Varsayılan: ${formatCurrency(partnerBaseSalary)}`}
          />

          {/* Kar Payı */}
          <TextField
            label="Kar Payı"
            type="number"
            value={formData.profitShare}
            onChange={handleChange('profitShare')}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">₺</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 100 }}
            helperText="Bu ay ortağa düşen kar payı"
          />

          {/* Bu Ay Çekilen */}
          <TextField
            label="Bu Ay Çekilen"
            type="number"
            value={formData.actualWithdrawn}
            onChange={handleChange('actualWithdrawn')}
            fullWidth
            InputProps={{
              endAdornment: <InputAdornment position="end">₺</InputAdornment>,
            }}
            inputProps={{ min: 0, step: 100 }}
            helperText="Ortağın bu ay fiilen çektiği para"
          />

          {/* Not */}
          <TextField
            label="Not (opsiyonel)"
            value={formData.note}
            onChange={handleChange('note')}
            fullWidth
            multiline
            rows={2}
          />

          <Divider />

          {/* Hesaplanan Sonuç */}
          <Paper 
            sx={{ 
              p: 2, 
              backgroundColor: isOverdrawn ? 'warning.light' : 'success.light',
              color: isOverdrawn ? 'warning.contrastText' : 'success.contrastText',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Sonraki Aya Devreden Bakiye (Hesaplanan)
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(calculatedNextMonthBalance)}
            </Typography>
            <Typography variant="caption">
              {isOverdrawn ? 'Fazla alınan - ortak şirkete borçlu' : 'Eksik alınan - şirket ortağa borçlu'}
            </Typography>
          </Paper>
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

export default PartnerStatementFormModal;
