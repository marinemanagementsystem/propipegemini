import React from 'react';
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
      Chip,
      Typography,
      Box,
      CircularProgress,
      IconButton,
      alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockIcon from '@mui/icons-material/Lock';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface HistoryEntry {
      id: string;
      changedAt: { toDate: () => Date } | Date;
      changedByDisplayName?: string;
      changedByEmail?: string;
      changeType: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      previousData?: any;
      // Line-specific fields
      lineId?: string;
      lineDescription?: string;
      lineAmount?: number;
      lineDirection?: "INCOME" | "EXPENSE";
}

interface HistoryModalProps {
      open: boolean;
      onClose: () => void;
      title: string;
      loading: boolean;
      history: HistoryEntry[];
      onRevert?: (entry: HistoryEntry) => void;
      renderPreviousValue?: (entry: HistoryEntry) => React.ReactNode;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
      open,
      onClose,
      title,
      loading,
      history,
      onRevert,
      renderPreviousValue,
}) => {
      const theme = useTheme();
      const isDark = theme.palette.mode === 'dark';

      const formatDate = (date: { toDate?: () => Date } | Date | null | undefined) => {
            if (!date) return '-';
            const d = date && typeof date === 'object' && 'toDate' in date && date.toDate ? date.toDate() : new Date(date as Date);
            return d.toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
            });
      };

      const getChangeTypeLabel = (type: string) => {
            switch (type) {
                  case 'UPDATE': return 'Güncellendi';
                  case 'DELETE': return 'Silindi';
                  case 'REVERT': return 'Geri Alındı';
                  case 'STATUS_CHANGE': return 'Durum Değişti';
                  case 'LINE_ADD': return 'Satır Eklendi';
                  case 'LINE_UPDATE': return 'Satır Güncellendi';
                  case 'LINE_DELETE': return 'Satır Silindi';
                  case 'CLOSE': return 'Dönem Kapatıldı';
                  default: return type;
            }
      };

      const getChangeTypeColor = (type: string): "info" | "error" | "success" | "warning" | "default" | "primary" | "secondary" => {
            switch (type) {
                  case 'UPDATE': return 'info';
                  case 'DELETE': return 'error';
                  case 'REVERT': return 'success';
                  case 'STATUS_CHANGE': return 'warning';
                  case 'LINE_ADD': return 'success';
                  case 'LINE_UPDATE': return 'info';
                  case 'LINE_DELETE': return 'error';
                  case 'CLOSE': return 'secondary';
                  default: return 'default';
            }
      };

      const getChangeTypeIcon = (type: string) => {
            switch (type) {
                  case 'LINE_ADD': return <AddCircleOutlineIcon fontSize="small" />;
                  case 'LINE_UPDATE': return <EditIcon fontSize="small" />;
                  case 'LINE_DELETE': return <DeleteOutlineIcon fontSize="small" />;
                  case 'CLOSE': return <LockIcon fontSize="small" />;
                  default: return null;
            }
      };

      const formatAmount = (amount: number | undefined) => {
            if (amount === undefined) return '';
            return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
      };

      const renderLineDetails = (entry: HistoryEntry) => {
            if (!entry.lineDescription && !entry.lineAmount) return null;
            
            const isIncome = entry.lineDirection === 'INCOME';
            
            return (
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        {isIncome ? (
                              <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16 }} />
                        ) : (
                              <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16 }} />
                        )}
                        <Typography variant="caption" color="text.secondary">
                              {entry.lineDescription}
                              {entry.lineAmount !== undefined && (
                                    <Box component="span" sx={{ 
                                          ml: 1, 
                                          fontWeight: 600, 
                                          color: isIncome ? 'success.main' : 'error.main' 
                                    }}>
                                          {formatAmount(entry.lineAmount)}
                                    </Box>
                              )}
                        </Typography>
                  </Box>
            );
      };

      return (
            <Dialog
                  open={open}
                  onClose={onClose}
                  maxWidth="md"
                  fullWidth
                  PaperProps={{
                        sx: {
                              borderRadius: 4,
                              bgcolor: isDark ? '#1e293b' : '#ffffff',
                        },
                  }}
            >
                  <DialogTitle sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        pb: 2,
                  }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                              <HistoryIcon color="primary" />
                              <Typography variant="h6" fontWeight={600}>
                                    {title}
                              </Typography>
                        </Box>
                        <IconButton onClick={onClose} size="small">
                              <CloseIcon />
                        </IconButton>
                  </DialogTitle>

                  <DialogContent sx={{ p: 0 }}>
                        {loading ? (
                              <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                                    <CircularProgress />
                              </Box>
                        ) : history.length === 0 ? (
                              <Box textAlign="center" py={6}>
                                    <Typography color="text.secondary">
                                          Henüz değişiklik geçmişi yok
                                    </Typography>
                              </Box>
                        ) : (
                              <TableContainer sx={{ maxHeight: 500 }}>
                                    <Table size="small" stickyHeader>
                                          <TableHead>
                                                <TableRow>
                                                      <TableCell sx={{ fontWeight: 600, py: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>Tarih</TableCell>
                                                      <TableCell sx={{ fontWeight: 600, py: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>İşlem Yapan</TableCell>
                                                      <TableCell sx={{ fontWeight: 600, py: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>İşlem</TableCell>
                                                      <TableCell sx={{ fontWeight: 600, py: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc' }}>Detay</TableCell>
                                                      {onRevert && (
                                                            <TableCell sx={{ fontWeight: 600, py: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc' }} align="right">Aksiyon</TableCell>
                                                      )}
                                                </TableRow>
                                          </TableHead>
                                          <TableBody>
                                                {history.map((entry) => (
                                                      <TableRow key={entry.id} hover>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                  <Typography variant="body2">
                                                                        {formatDate(entry.changedAt)}
                                                                  </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                  <Typography variant="body2" fontWeight={500}>
                                                                        {entry.changedByDisplayName || entry.changedByEmail || 'Bilinmiyor'}
                                                                  </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                  <Chip
                                                                        icon={getChangeTypeIcon(entry.changeType) || undefined}
                                                                        label={getChangeTypeLabel(entry.changeType)}
                                                                        size="small"
                                                                        color={getChangeTypeColor(entry.changeType)}
                                                                        variant="filled"
                                                                  />
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.5 }}>
                                                                  {renderPreviousValue ? (
                                                                        renderPreviousValue(entry)
                                                                  ) : (
                                                                        renderLineDetails(entry)
                                                                  )}
                                                            </TableCell>
                                                            {onRevert && (
                                                                  <TableCell sx={{ py: 1.5 }} align="right">
                                                                        <Button
                                                                              size="small"
                                                                              variant="outlined"
                                                                              startIcon={<RestoreIcon />}
                                                                              onClick={() => onRevert(entry)}
                                                                              sx={{ 
                                                                                    borderRadius: 2,
                                                                                    textTransform: 'none',
                                                                              }}
                                                                        >
                                                                              Geri Dön
                                                                        </Button>
                                                                  </TableCell>
                                                            )}
                                                      </TableRow>
                                                ))}
                                          </TableBody>
                                    </Table>
                              </TableContainer>
                        )}
                  </DialogContent>

                  <DialogActions sx={{ 
                        px: 3, 
                        py: 2,
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}>
                        <Button onClick={onClose} color="primary">
                              Kapat
                        </Button>
                  </DialogActions>
            </Dialog>
      );
};

export default HistoryModal;
