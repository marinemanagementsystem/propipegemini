import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import type { Partner, PartnerStatement } from '../types/Partner';
import { MONTH_NAMES } from '../types/Partner';
import {
  getPartnerById,
  getPartnerStatements,
  deletePartnerStatement,
  closePartnerStatement,
  reopenPartnerStatement,
} from '../services/partners';
import { useAuth } from '../context/AuthContext';
import PartnerStatementFormModal from '../components/PartnerStatementFormModal';
import PartnerStatementHistoryModal from '../components/PartnerStatementHistoryModal';

const PartnerDetailPage: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { currentUserAuth } = useAuth();

  const [partner, setPartner] = useState<Partner | null>(null);
  const [statements, setStatements] = useState<PartnerStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingStatement, setEditingStatement] = useState<PartnerStatement | null>(null);
  const [confirmClose, setConfirmClose] = useState<PartnerStatement | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PartnerStatement | null>(null);
  const [confirmReopen, setConfirmReopen] = useState<PartnerStatement | null>(null);
  const [historyStatement, setHistoryStatement] = useState<PartnerStatement | null>(null);

  // Verileri yükle
  const loadData = React.useCallback(async () => {
    if (!partnerId) return;

    try {
      setLoading(true);
      setError(null);

      const [partnerData, statementsData] = await Promise.all([
        getPartnerById(partnerId),
        getPartnerStatements(partnerId),
      ]);

      if (!partnerData) {
        setError('Ortak bulunamadı.');
        return;
      }

      setPartner(partnerData);
      setStatements(statementsData);
    } catch (err) {
      console.error('Veriler yüklenirken hata:', err);
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Para formatla
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Bakiye açıklaması
  const getBalanceDescription = (balance: number): { text: string; color: string } => {
    if (balance > 0) {
      return { text: 'Fazla alınan (ortak şirkete borçlu)', color: 'warning.main' };
    } else if (balance < 0) {
      return { text: 'Eksik alınan (şirket ortağa borçlu)', color: 'success.main' };
    }
    return { text: 'Bakiye dengede', color: 'text.secondary' };
  };

  // Dönem formatla
  const formatPeriod = (month: number, year: number): string => {
    return `${MONTH_NAMES[month]} ${year}`;
  };

  // Dönemi kapat
  const handleCloseStatement = async () => {
    if (!confirmClose) return;

    try {
      await closePartnerStatement(
        confirmClose.id,
        currentUserAuth ? {
          uid: currentUserAuth.uid,
          email: currentUserAuth.email || '',
          displayName: currentUserAuth.displayName || '',
        } : undefined
      );
      setConfirmClose(null);
      loadData();
    } catch (err) {
      console.error('Dönem kapatılırken hata:', err);
      setError('Dönem kapatılırken bir hata oluştu.');
    }
  };

  // Dönemi yeniden aç
  const handleReopenStatement = async () => {
    if (!confirmReopen) return;

    try {
      await reopenPartnerStatement(
        confirmReopen.id,
        currentUserAuth ? {
          uid: currentUserAuth.uid,
          email: currentUserAuth.email || '',
          displayName: currentUserAuth.displayName || '',
        } : undefined
      );
      setConfirmReopen(null);
      loadData();
    } catch (err) {
      console.error('Dönem açılırken hata:', err);
      setError('Dönem açılırken bir hata oluştu.');
    }
  };

  // Dönemi sil
  const handleDeleteStatement = async () => {
    if (!confirmDelete) return;

    try {
      await deletePartnerStatement(confirmDelete.id);
      setConfirmDelete(null);
      loadData();
    } catch (err) {
      console.error('Dönem silinirken hata:', err);
      setError('Dönem silinirken bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!partner) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Ortak bulunamadı.'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/partners')} sx={{ mt: 2 }}>
          Ortaklara Dön
        </Button>
      </Box>
    );
  }

  const balanceInfo = getBalanceDescription(partner.currentBalance);

  return (
    <Box sx={{ p: 3 }}>
      {/* Geri Butonu ve Başlık */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/partners')}>
          Geri
        </Button>
        <Typography variant="h4" fontWeight="bold">
          {partner.name}
        </Typography>
        {!partner.isActive && (
          <Chip label="Pasif" color="default" size="small" />
        )}
      </Box>

      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Ortak Bilgi Kartları */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Hisse Oranı
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                %{partner.sharePercentage}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Aylık Maaş
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(partner.baseSalary)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Güncel Bakiye
              </Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: balanceInfo.color }}>
                {formatCurrency(partner.currentBalance)}
              </Typography>
              <Typography variant="caption" sx={{ color: balanceInfo.color }}>
                {balanceInfo.text}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Toplam Dönem
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {statements.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* Aylık Hesap Tablosu Başlığı */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight="bold">
          Aylık Hesap Dönemleri
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingStatement(null);
            setShowFormModal(true);
          }}
        >
          Yeni Dönem Satırı Ekle
        </Button>
      </Box>

      {/* Statement Tablosu */}
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dönem</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Devreden Bakiye</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Kişisel Harc. İadesi</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Maaş</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Kar Payı</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Bu Ay Çekilen</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Sonraki Aya Devreden</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Durum</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {statements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Henüz dönem kaydı bulunmamaktadır.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              statements.map((statement) => (
                <TableRow 
                  key={statement.id} 
                  hover
                  sx={{
                    backgroundColor: statement.status === 'CLOSED' ? 'action.hover' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography fontWeight="medium">
                      {formatPeriod(statement.month, statement.year)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: statement.previousBalance >= 0 ? 'warning.main' : 'success.main' }}>
                      {formatCurrency(statement.previousBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(statement.personalExpenseReimbursement)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(statement.monthlySalary)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(statement.profitShare)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography sx={{ color: 'warning.main' }}>
                      {formatCurrency(statement.actualWithdrawn)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" sx={{ color: statement.nextMonthBalance >= 0 ? 'warning.main' : 'success.main' }}>
                      {formatCurrency(statement.nextMonthBalance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={statement.status === 'CLOSED' ? 'Kapalı' : 'Taslak'}
                      size="small"
                      color={statement.status === 'CLOSED' ? 'default' : 'warning'}
                      icon={statement.status === 'CLOSED' ? <LockIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={0.5}>
                      <Tooltip title="Düzenle">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => {
                            setEditingStatement(statement);
                            setShowFormModal(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Geçmiş">
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => setHistoryStatement(statement)}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {statement.status === 'DRAFT' && (
                        <>
                          <Tooltip title="Dönemi Kapat">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => setConfirmClose(statement)}
                            >
                              <LockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirmDelete(statement)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {statement.status === 'CLOSED' && (
                        <Tooltip title="Yeniden Aç">
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => setConfirmReopen(statement)}
                          >
                            <LockOpenIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Formül Açıklaması */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Hesaplama Formülü:
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
          Sonraki Aya Devreden = Devreden Bakiye + Bu Ay Çekilen - (Kişisel Harc. İadesi + Maaş + Kar Payı)
        </Typography>
      </Paper>

      {/* Form Modal */}
      {partnerId && (
        <PartnerStatementFormModal
          open={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setEditingStatement(null);
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingStatement(null);
            loadData();
          }}
          partnerId={partnerId}
          partnerBaseSalary={partner.baseSalary}
          statement={editingStatement}
        />
      )}

      {/* Dönem Kapatma Onay Dialogu */}
      <Dialog open={!!confirmClose} onClose={() => setConfirmClose(null)}>
        <DialogTitle>Dönemi Kapat</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{confirmClose && formatPeriod(confirmClose.month, confirmClose.year)}</strong> dönemini 
            kapatmak istediğinizden emin misiniz?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Kapatılan ayın alanları daha sonra değiştirilemez.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(null)}>İptal</Button>
          <Button onClick={handleCloseStatement} variant="contained" color="success">
            Evet, Kapat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Yeniden Açma Onay Dialogu */}
      <Dialog open={!!confirmReopen} onClose={() => setConfirmReopen(null)}>
        <DialogTitle>Dönemi Yeniden Aç</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{confirmReopen && formatPeriod(confirmReopen.month, confirmReopen.year)}</strong> dönemini 
            yeniden açmak istediğinizden emin misiniz?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Dönem taslak durumuna dönecek ve düzenlenebilir olacak.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmReopen(null)}>İptal</Button>
          <Button onClick={handleReopenStatement} variant="contained" color="warning">
            Evet, Yeniden Aç
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay Dialogu */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Dönemi Sil</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{confirmDelete && formatPeriod(confirmDelete.month, confirmDelete.year)}</strong> dönemini 
            silmek istediğinizden emin misiniz?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Bu işlem geri alınamaz!
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>İptal</Button>
          <Button onClick={handleDeleteStatement} variant="contained" color="error">
            Evet, Sil
          </Button>
        </DialogActions>
      </Dialog>

      {/* Geçmiş Modal */}
      {historyStatement && (
        <PartnerStatementHistoryModal
          open={!!historyStatement}
          onClose={() => setHistoryStatement(null)}
          statementId={historyStatement.id}
          year={historyStatement.year}
          month={historyStatement.month}
        />
      )}
    </Box>
  );
};

export default PartnerDetailPage;
