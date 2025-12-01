import React, { useEffect, useState, useCallback } from 'react';
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
  Box,
  Chip,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { PartnerStatementHistoryEntry } from '../types/Partner';
import { MONTH_NAMES } from '../types/Partner';
import { getStatementHistory } from '../services/partners';

interface PartnerStatementHistoryModalProps {
  open: boolean;
  onClose: () => void;
  statementId: string;
  year: number;
  month: number;
}

const PartnerStatementHistoryModal: React.FC<PartnerStatementHistoryModalProps> = ({
  open,
  onClose,
  statementId,
  year,
  month,
}) => {
  const [history, setHistory] = useState<PartnerStatementHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStatementHistory(statementId);
      setHistory(data);
    } catch (error) {
      console.error('History yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [statementId]);

  useEffect(() => {
    if (open && statementId) {
      loadHistory();
    }
  }, [open, statementId, loadHistory]);

  const getChangeTypeLabel = (type: string): { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default' } => {
    switch (type) {
      case 'CREATE':
        return { label: 'Oluşturuldu', color: 'success' };
      case 'UPDATE':
        return { label: 'Güncellendi', color: 'info' };
      case 'CLOSE':
        return { label: 'Kapatıldı', color: 'warning' };
      case 'REOPEN':
        return { label: 'Yeniden Açıldı', color: 'default' };
      case 'DELETE':
        return { label: 'Silindi', color: 'error' };
      default:
        return { label: type, color: 'default' };
    }
  };

  const formatDate = (timestamp: unknown): string => {
    if (!timestamp) return '-';
    
    let date: Date;
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
      date = (timestamp as { toDate: () => Date }).toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      return '-';
    }

    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Değişiklik Geçmişi - {MONTH_NAMES[month - 1]} {year}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : history.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Henüz değişiklik kaydı bulunmuyor.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tarih</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>İşlem</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Kullanıcı</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Önceki Bakiye</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Masraf İadesi</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Maaş</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Kar Payı</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Fiili Çekilen</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Sonraki Bakiye</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((entry) => {
                  const typeInfo = getChangeTypeLabel(entry.changeType);
                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(entry.changedAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeInfo.label}
                          color={typeInfo.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {entry.changedByDisplayName || entry.changedByEmail || '-'}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.previousData?.previousBalance)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.previousData?.personalExpenseReimbursement)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.previousData?.monthlySalary)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.previousData?.profitShare)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.previousData?.actualWithdrawn)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(entry.previousData?.nextMonthBalance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartnerStatementHistoryModal;
