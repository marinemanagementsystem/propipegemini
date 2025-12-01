import React, { useEffect, useState } from 'react';
import {
      Dialog,
      DialogTitle,
      DialogContent,
      DialogActions,
      Button,
      Table,
      TableBody,
      TableCell,
      TableContainer,
      TableHead,
      TableRow,
      Paper,
      Typography,
      IconButton,
      Chip,
      CircularProgress,
      useMediaQuery,
      useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';
import type { ExpenseHistoryEntry } from '../types/Expense';
import { getExpenseHistory, revertExpense } from '../services/expenses';
import { useAuth } from '../context/AuthContext';

interface ExpenseHistoryModalProps {
      open: boolean;
      onClose: () => void;
      expenseId: string | null;
      onRevertSuccess: () => void;
}

const ExpenseHistoryModal: React.FC<ExpenseHistoryModalProps> = ({
      open,
      onClose,
      expenseId,
      onRevertSuccess
}) => {
      const [history, setHistory] = useState<ExpenseHistoryEntry[]>([]);
      const [loading, setLoading] = useState(false);
      const { currentUserAuth, currentUserProfile } = useAuth();

      useEffect(() => {
            if (open && expenseId) {
                  fetchHistory(expenseId);
            }
      }, [open, expenseId]);

      const fetchHistory = async (id: string) => {
            setLoading(true);
            try {
                  const data = await getExpenseHistory(id);
                  setHistory(data);
            } catch (error) {
                  console.error("Error fetching history:", error);
            } finally {
                  setLoading(false);
            }
      };

      const handleRevert = async (entry: ExpenseHistoryEntry) => {
            if (!expenseId || !currentUserAuth) return;

            if (window.confirm("Bu sürüme geri dönmek istediğinizden emin misiniz? Mevcut veriler değişecektir.")) {
                  try {
                        const user = {
                              uid: currentUserAuth.uid,
                              email: currentUserAuth.email,
                              displayName: currentUserProfile?.displayName
                        };
                        await revertExpense(expenseId, entry, user);
                        alert("Başarıyla geri alındı.");
                        onRevertSuccess();
                        onClose();
                  } catch (error) {
                        console.error("Revert error:", error);
                        alert("Geri alma işlemi başarısız oldu.");
                  }
            }
      };

      const formatDate = (timestamp: any) => {
            if (!timestamp) return '-';
            const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return d.toLocaleString('tr-TR');
      };

      const getChangeTypeLabel = (type: string) => {
            switch (type) {
                  case 'UPDATE': return <Chip label="📝 Düzenlendi" color="primary" size="small" variant="outlined" />;
                  case 'DELETE': return <Chip label="🗑️ Silindi" color="error" size="small" variant="outlined" />;
                  case 'REVERT': return <Chip label="↩️ Geri Alındı" color="warning" size="small" variant="outlined" />;
                  default: return <Chip label={type} size="small" />;
            }
      };

      const getPreviousStatusLabel = (data: any) => {
            if (data.isDeleted) {
                  return <Chip label="SİLİNMİŞ" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 'bold' }} />;
            }
            return (
                  <Chip
                        label={data.status === 'PAID' ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                        size="small"
                        sx={{
                              bgcolor: data.status === 'PAID' ? '#e8f5e9' : '#fff3e0',
                              color: data.status === 'PAID' ? '#2e7d32' : '#ef6c00',
                              fontWeight: 'bold'
                        }}
                  />
            );
      };

      const theme = useTheme();
      const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

      return (
            <Dialog
                  open={open}
                  onClose={onClose}
                  maxWidth="md"
                  fullWidth
                  fullScreen={fullScreen}
                  PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
            >
                  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography component="div" variant="h6" fontWeight="bold">
                              Değişiklik Geçmişi
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                              <CloseIcon />
                        </IconButton>
                  </DialogTitle>
                  <DialogContent dividers>
                        {loading ? (
                              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                                    <CircularProgress />
                              </div>
                        ) : history.length === 0 ? (
                              <Typography align="center" color="textSecondary" sx={{ py: 3 }}>
                                    Henüz bir geçmiş kaydı yok.
                              </Typography>
                        ) : (
                              <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ overflowX: 'auto' }}>
                                    <Table size="small" sx={{ minWidth: 600 }}>
                                          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                                <TableRow>
                                                      <TableCell><strong>Tarih</strong></TableCell>
                                                      <TableCell><strong>İşlem Yapan</strong></TableCell>
                                                      <TableCell><strong>Yapılan İşlem</strong></TableCell>
                                                      <TableCell><strong>Eski Tutar</strong></TableCell>
                                                      <TableCell><strong>Eski Durum</strong></TableCell>
                                                      <TableCell align="right"><strong>Aksiyon</strong></TableCell>
                                                </TableRow>
                                          </TableHead>
                                          <TableBody>
                                                {history.map((entry) => (
                                                      <TableRow key={entry.id} hover>
                                                            <TableCell>{formatDate(entry.changedAt)}</TableCell>
                                                            <TableCell>
                                                                  <Typography variant="body2" fontWeight="bold">
                                                                        {entry.changedByDisplayName || entry.changedByEmail || 'Bilinmiyor'}
                                                                  </Typography>
                                                            </TableCell>
                                                            <TableCell>{getChangeTypeLabel(entry.changeType)}</TableCell>
                                                            <TableCell>
                                                                  {entry.previousData.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {entry.previousData.currency}
                                                            </TableCell>
                                                            <TableCell>
                                                                  {getPreviousStatusLabel(entry.previousData)}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                  <Button
                                                                        startIcon={<RestoreIcon />}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        onClick={() => handleRevert(entry)}
                                                                        sx={{ textTransform: 'none' }}
                                                                  >
                                                                        Bu sürüme dön
                                                                  </Button>
                                                            </TableCell>
                                                      </TableRow>
                                                ))}
                                          </TableBody>
                                    </Table>
                              </TableContainer>
                        )}
                  </DialogContent>
                  <DialogActions>
                        <Button onClick={onClose}>Kapat</Button>
                  </DialogActions>
            </Dialog>
      );
};

export default ExpenseHistoryModal;
