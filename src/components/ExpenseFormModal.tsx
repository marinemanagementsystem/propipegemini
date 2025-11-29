import React, { useState, useEffect } from 'react';
import {
      Dialog,
      DialogTitle,
      DialogContent,
      DialogActions,
      Button,
      TextField,
      Grid,
      MenuItem,
      FormControl,
      InputLabel,
      Select,
      Box,
      Typography,
      IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import type { Expense, ExpenseFormData } from '../types/Expense';

interface ExpenseFormModalProps {
      open: boolean;
      onClose: () => void;
      onSubmit: (data: ExpenseFormData) => void;
      initialData?: Expense | null;
      loading?: boolean;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
      open,
      onClose,
      onSubmit,
      initialData,
      loading = false
}) => {
      const [formData, setFormData] = useState<ExpenseFormData>({
            amount: 0,
            description: '',
            date: new Date(),
            type: 'COMPANY_OFFICIAL',
            status: 'PAID',
            ownerId: '',
            currency: 'TRY',
            paymentMethod: 'CASH',
            projectId: '',
            category: '',
            receiptFile: null
      });

      useEffect(() => {
            if (initialData) {
                  setFormData({
                        amount: initialData.amount,
                        description: initialData.description,
                        date: (initialData.date as any).toDate ? (initialData.date as any).toDate() : new Date(initialData.date as any),
                        type: initialData.type,
                        status: initialData.status,
                        ownerId: initialData.ownerId,
                        currency: initialData.currency,
                        paymentMethod: initialData.paymentMethod,
                        projectId: initialData.projectId || '',
                        category: initialData.category || '',
                        receiptFile: null
                  });
            } else {
                  setFormData({
                        amount: 0,
                        description: '',
                        date: new Date(),
                        type: 'COMPANY_OFFICIAL',
                        status: 'PAID',
                        ownerId: '',
                        currency: 'TRY',
                        paymentMethod: 'CASH',
                        projectId: '',
                        category: '',
                        receiptFile: null
                  });
            }
      }, [initialData, open]);

      const handleChange = (field: keyof ExpenseFormData, value: any) => {
            setFormData(prev => ({ ...prev, [field]: value }));
      };

      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.files && event.target.files[0]) {
                  setFormData(prev => ({ ...prev, receiptFile: event.target.files![0] }));
            }
      };

      const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSubmit(formData);
      };

      return (
            <Dialog
                  open={open}
                  onClose={onClose}
                  maxWidth="sm"
                  fullWidth
                  PaperProps={{
                        sx: { borderRadius: 3 }
                  }}
            >
                  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                              {initialData ? 'Gider Düzenle' : 'Yeni Gider Ekle'}
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                              <CloseIcon />
                        </IconButton>
                  </DialogTitle>

                  <form onSubmit={handleSubmit}>
                        <DialogContent dividers sx={{ pt: 3 }}>
                              <Grid container spacing={3}>

                                    {/* Tutar ve Para Birimi */}
                                    <Grid size={{ xs: 8 }}>
                                          <TextField
                                                label="Tutar*"
                                                type="number"
                                                fullWidth
                                                value={formData.amount}
                                                onChange={(e) => handleChange('amount', e.target.value)}
                                                required
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 4 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Para Birimi*</InputLabel>
                                                <Select
                                                      value={formData.currency}
                                                      label="Para Birimi*"
                                                      onChange={(e) => handleChange('currency', e.target.value)}
                                                      sx={{ borderRadius: 2 }}
                                                >
                                                      <MenuItem value="TRY">TRY</MenuItem>
                                                      <MenuItem value="USD">USD</MenuItem>
                                                      <MenuItem value="EUR">EUR</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>

                                    {/* Açıklama */}
                                    <Grid size={{ xs: 12 }}>
                                          <TextField
                                                label="Açıklama*"
                                                fullWidth
                                                value={formData.description}
                                                onChange={(e) => handleChange('description', e.target.value)}
                                                required
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                          />
                                    </Grid>

                                    {/* Tarih */}
                                    <Grid size={{ xs: 6 }}>
                                          <TextField
                                                label="Tarih*"
                                                type="date"
                                                fullWidth
                                                value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleChange('date', new Date(e.target.value))}
                                                required
                                                InputLabelProps={{ shrink: true }}
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                          />
                                    </Grid>

                                    {/* Gider Sahibi */}
                                    <Grid size={{ xs: 6 }}>
                                          <TextField
                                                label="Gider Sahibi*"
                                                fullWidth
                                                value={formData.ownerId}
                                                onChange={(e) => handleChange('ownerId', e.target.value)}
                                                required
                                                placeholder="Ad Soyad"
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                          />
                                    </Grid>

                                    {/* Tür ve Durum */}
                                    <Grid size={{ xs: 6 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Tür*</InputLabel>
                                                <Select
                                                      value={formData.type}
                                                      label="Tür*"
                                                      onChange={(e) => handleChange('type', e.target.value)}
                                                      sx={{ borderRadius: 2 }}
                                                >
                                                      <MenuItem value="COMPANY_OFFICIAL">Şirket Resmi</MenuItem>
                                                      <MenuItem value="PERSONAL">Kişisel</MenuItem>
                                                      <MenuItem value="ADVANCE">Avans</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Durum*</InputLabel>
                                                <Select
                                                      value={formData.status}
                                                      label="Durum*"
                                                      onChange={(e) => handleChange('status', e.target.value)}
                                                      sx={{ borderRadius: 2 }}
                                                >
                                                      <MenuItem value="PAID">Ödendi</MenuItem>
                                                      <MenuItem value="UNPAID">Ödenmedi</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>

                                    {/* Ödeme Yöntemi */}
                                    <Grid size={{ xs: 12 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Ödeme Yöntemi*</InputLabel>
                                                <Select
                                                      value={formData.paymentMethod}
                                                      label="Ödeme Yöntemi*"
                                                      onChange={(e) => handleChange('paymentMethod', e.target.value)}
                                                      sx={{ borderRadius: 2 }}
                                                >
                                                      <MenuItem value="CASH">Nakit</MenuItem>
                                                      <MenuItem value="CREDIT_CARD">Kredi Kartı</MenuItem>
                                                      <MenuItem value="BANK_TRANSFER">Havale/EFT</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>

                                    {/* Proje ve Kategori (Opsiyonel) */}
                                    <Grid size={{ xs: 6 }}>
                                          <TextField
                                                label="Proje"
                                                fullWidth
                                                value={formData.projectId}
                                                onChange={(e) => handleChange('projectId', e.target.value)}
                                                placeholder="Proje A"
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                          <TextField
                                                label="Kategori"
                                                fullWidth
                                                value={formData.category}
                                                onChange={(e) => handleChange('category', e.target.value)}
                                                placeholder="Yemek"
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                          />
                                    </Grid>

                                    {/* Dosya Yükleme Alanı */}
                                    <Grid size={{ xs: 12 }}>
                                          <Typography variant="subtitle2" gutterBottom>Dekont Yükle</Typography>
                                          <Box
                                                sx={{
                                                      border: '2px dashed #e0e0e0',
                                                      borderRadius: 2,
                                                      p: 3,
                                                      textAlign: 'center',
                                                      cursor: 'pointer',
                                                      '&:hover': {
                                                            borderColor: 'primary.main',
                                                            bgcolor: '#f5f9ff'
                                                      }
                                                }}
                                                component="label"
                                          >
                                                <input
                                                      type="file"
                                                      hidden
                                                      onChange={handleFileChange}
                                                      accept="image/*,.pdf"
                                                />
                                                <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                                <Typography variant="body2" color="textSecondary">
                                                      {formData.receiptFile ? formData.receiptFile.name : 'Yüklemek için tıklayın veya dosyayı sürükleyin'}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" display="block">
                                                      PNG, JPG, PDF (MAX. 5MB)
                                                </Typography>
                                          </Box>
                                    </Grid>

                              </Grid>
                        </DialogContent>
                        <DialogActions sx={{ p: 3 }}>
                              <Button onClick={onClose} variant="outlined" fullWidth sx={{ borderRadius: 2, py: 1.5, bgcolor: '#f5f5f5', border: 'none', color: 'text.primary' }}>
                                    İptal
                              </Button>
                              <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    disabled={loading}
                                    sx={{ borderRadius: 2, py: 1.5, bgcolor: 'primary.main' }}
                              >
                                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                              </Button>
                        </DialogActions>
                  </form>
            </Dialog>
      );
};

export default ExpenseFormModal;
