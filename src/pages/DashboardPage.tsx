import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  getDashboardSummary,
  getLast6MonthsExpensesTrend,
  getLast6MonthsStatementsTrend,
  getUpcomingNetworkActions,
  getLatestExpenses,
  getLatestClosedStatements,
  getExpenseStatusLabel,
  getTransferActionLabel,
  getQuoteStatusLabelTR,
  type DashboardSummary,
  type MonthlyTrendItem,
  type StatementTrendItem,
  type NetworkActionItem,
  type StatementWithProject,
} from '../services/dashboard';
import { updateCompanyOverview, formatCurrency } from '../services/companyOverview';
import type { Expense } from '../types/Expense';
import { Timestamp } from 'firebase/firestore';

// ==================== YARDIMCI FONKSİYONLAR ====================

const formatDate = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return '-';
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatDateShort = (timestamp: Timestamp | undefined): string => {
  if (!timestamp) return '-';
  const date = timestamp.toDate();
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
};

// ==================== ALT BİLEŞENLER ====================

// Özet Kart Skeleton
const SummaryCardSkeleton: React.FC = () => (
  <Card elevation={2} sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
      <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
    </CardContent>
  </Card>
);

// Şirket Kasası Düzenleme Modal
interface SafeEditModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  onSave: (newBalance: number) => Promise<void>;
}

const SafeEditModal: React.FC<SafeEditModalProps> = ({
  open,
  onClose,
  currentBalance,
  onSave,
}) => {
  const [balance, setBalance] = useState(currentBalance);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    setBalance(currentBalance);
  }, [currentBalance, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(balance);
      onClose();
    } catch (error) {
      console.error('Kasa güncelleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Şirket Kasasını Güncelle</DialogTitle>
      <DialogContent>
        <TextField
          label="Şirket Kasası (TL)"
          type="number"
          value={balance}
          onChange={(e) => setBalance(Number(e.target.value))}
          fullWidth
          sx={{ mt: 2 }}
          InputProps={{
            endAdornment: <InputAdornment position="end">₺</InputAdornment>,
          }}
          helperText="Banka + Nakit toplam tutarını giriniz"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>İptal</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ==================== ANA BİLEŞEN ====================

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUserAuth } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State'ler
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expensesTrend, setExpensesTrend] = useState<MonthlyTrendItem[]>([]);
  const [statementsTrend, setStatementsTrend] = useState<StatementTrendItem[]>([]);
  const [networkActions, setNetworkActions] = useState<NetworkActionItem[]>([]);
  const [latestExpenses, setLatestExpenses] = useState<Expense[]>([]);
  const [latestStatements, setLatestStatements] = useState<StatementWithProject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [safeModalOpen, setSafeModalOpen] = useState(false);

  // Verileri yükle
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        summaryData,
        expensesTrendData,
        statementsTrendData,
        networkActionsData,
        latestExpensesData,
        latestStatementsData,
      ] = await Promise.all([
        getDashboardSummary(),
        getLast6MonthsExpensesTrend(),
        getLast6MonthsStatementsTrend(),
        getUpcomingNetworkActions(),
        getLatestExpenses(5),
        getLatestClosedStatements(5),
      ]);

      setSummary(summaryData);
      setExpensesTrend(expensesTrendData);
      setStatementsTrend(statementsTrendData);
      setNetworkActions(networkActionsData);
      setLatestExpenses(latestExpensesData);
      setLatestStatements(latestStatementsData);
    } catch (err) {
      console.error('Dashboard veri yükleme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kasa güncelleme
  const handleSaveCompanySafe = async (newBalance: number) => {
    await updateCompanyOverview(
      { companySafeBalance: newBalance },
      currentUserAuth ? {
        uid: currentUserAuth.uid,
        email: currentUserAuth.email || '',
        displayName: currentUserAuth.displayName || '',
      } : undefined
    );
    // Veriyi yeniden yükle
    const newSummary = await getDashboardSummary();
    setSummary(newSummary);
  };

  // Chart renkleri
  const expenseChartColor = theme.palette.error.main;
  const statementChartColor = theme.palette.success.main;

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadData}>
          Yeniden Dene
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Başlık */}
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Ana Kumanda Paneli
      </Typography>

      {/* ==================== ÖZET KARTLAR ==================== */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Kart 1: Şirket Kasası */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {loading ? (
            <SummaryCardSkeleton />
          ) : (
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccountBalanceIcon color="primary" />
                    <Typography variant="subtitle2" color="text.secondary">
                      Şirket Kasası
                    </Typography>
                  </Box>
                  <Tooltip title="Düzenle">
                    <IconButton size="small" onClick={() => setSafeModalOpen(true)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'primary.main' }}>
                  {formatCurrency(summary?.companySafeBalance || 0, summary?.currency)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Son güncelleme: {summary?.lastUpdatedAt ? formatDate(summary.lastUpdatedAt) : '-'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Kart 2: Tersanelerdeki Toplam */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {loading ? (
            <SummaryCardSkeleton />
          ) : (
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <BusinessIcon color="info" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Tersanelerde Bekleyen Toplam
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'info.main' }}>
                  {formatCurrency(summary?.totalProjectsBalance || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Toplam {summary?.totalProjectsCount || 0} tersane
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Kart 3: Bu Ayki Giderler */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {loading ? (
            <SummaryCardSkeleton />
          ) : (
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <ReceiptIcon color="error" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Bu Ay Ödenen Giderler
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color: 'error.main' }}>
                  {formatCurrency(summary?.totalPaidExpensesThisMonth || 0)}
                </Typography>
                <Tooltip title="Sadece ÖDENDİ durumundaki giderler dahil edilir">
                  <Typography variant="caption" color="text.secondary" sx={{ cursor: 'help' }}>
                    Sadece ödenen giderler
                  </Typography>
                </Tooltip>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Kart 4: Ortak Hesap Özeti */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {loading ? (
            <SummaryCardSkeleton />
          ) : (
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <PeopleIcon color="warning" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Ortak Hesap Özeti
                  </Typography>
                </Box>
                <Box sx={{ mt: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TrendingDownIcon fontSize="small" color="error" />
                    <Typography variant="body2" color="text.secondary">
                      Şirketin borcu:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="error.main">
                      {formatCurrency(summary?.totalPartnersPositive || 0)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <TrendingUpIcon fontSize="small" color="success" />
                    <Typography variant="body2" color="text.secondary">
                      Ortakların borcu:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {formatCurrency(summary?.totalPartnersNegative || 0)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* ==================== GRAFİKLER ==================== */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Grafik 1: Son 6 Ay Gider */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Son 6 Ay Ödenen Giderler
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={expensesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke={theme.palette.text.secondary}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), 'Toplam']}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {expensesTrend.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={alpha(expenseChartColor, 0.7 + index * 0.05)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Grafik 2: Son 6 Ay Hakediş */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Son 6 Ay Hakediş Net Sonuçları
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={280}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statementsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke={theme.palette.text.secondary}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      'Net Tutar'
                    ]}
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="totalNetCash" radius={[4, 4, 0, 0]}>
                    {statementsTrend.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.totalNetCash >= 0 
                          ? alpha(statementChartColor, 0.7 + index * 0.05)
                          : alpha(theme.palette.error.main, 0.7)
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ==================== LİSTELER ==================== */}
      <Grid container spacing={3}>
        {/* Liste 1: Network - Aranacak Firmalar */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: isMobile ? 'auto' : 400, overflow: 'hidden' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Bugün / Yakında Aranacak Firmalar
              </Typography>
              <Button size="small" onClick={() => navigate('/network')}>
                Tümünü Gör
              </Button>
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : networkActions.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={300}>
                <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  Yaklaşan aksiyon bulunmuyor
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 300, overflowX: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Firma</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>İlgili Kişi</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Aksiyon Tarihi</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {networkActions.map((item) => (
                      <TableRow 
                        key={item.id} 
                        hover 
                        sx={{ 
                          cursor: 'pointer',
                          bgcolor: item.isOverdue ? alpha(theme.palette.error.main, 0.05) : 'inherit',
                        }}
                        onClick={() => navigate('/network')}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {item.isOverdue && (
                              <Tooltip title="Gecikmiş">
                                <WarningIcon fontSize="small" color="error" />
                              </Tooltip>
                            )}
                            <Typography variant="body2" fontWeight="medium">
                              {item.companyName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <Typography variant="body2">{item.contactPerson}</Typography>
                            {item.phone && (
                              <Tooltip title={item.phone}>
                                <PhoneIcon fontSize="small" color="action" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={item.isOverdue ? 'error.main' : 'text.primary'}
                            fontWeight={item.isOverdue ? 'bold' : 'normal'}
                          >
                            {formatDateShort(item.nextActionDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getQuoteStatusLabelTR(item.quoteStatus)}
                            size="small"
                            variant="outlined"
                            color={
                              item.quoteStatus === 'TEKLIF_VERILDI' ? 'success' :
                              item.quoteStatus === 'GORUSME_DEVAM_EDIYOR' ? 'info' :
                              'default'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Liste 2: Son Hareketler */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ p: 3, height: isMobile ? 'auto' : 400, overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Son Hareketler
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {/* Son 5 Gider */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Son 5 Gider
                </Typography>
                {latestExpenses.length === 0 ? (
                  <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
                    Gider kaydı bulunmuyor
                  </Typography>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    {latestExpenses.map((expense) => (
                      <Box
                        key={expense.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          '&:hover': { bgcolor: 'action.hover' },
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate('/expenses')}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {expense.description}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {formatDateShort(expense.date)}
                            </Typography>
                            <Chip
                              label={getExpenseStatusLabel(expense.status)}
                              size="small"
                              color={expense.status === 'PAID' ? 'success' : 'warning'}
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                        </Box>
                        <Typography variant="body2" fontWeight="bold" color="error.main">
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Son 5 Kapatılan Hakediş */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Son 5 Kapatılan Hakediş
                </Typography>
                {latestStatements.length === 0 ? (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    Kapatılmış hakediş bulunmuyor
                  </Typography>
                ) : (
                  <Box>
                    {latestStatements.map((statement) => (
                      <Box
                        key={statement.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 1,
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          '&:hover': { bgcolor: 'action.hover' },
                          cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/projects/${statement.projectId}`)}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {statement.projectName} - {statement.title}
                          </Typography>
                          <Box display="flex" gap={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {formatDateShort(statement.date)}
                            </Typography>
                            <Chip
                              label={getTransferActionLabel(statement.transferAction)}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                        </Box>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold" 
                          color={statement.totals?.netCashReal >= 0 ? 'success.main' : 'error.main'}
                        >
                          {formatCurrency(statement.totals?.netCashReal || 0)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Şirket Kasası Düzenleme Modal */}
      <SafeEditModal
        open={safeModalOpen}
        onClose={() => setSafeModalOpen(false)}
        currentBalance={summary?.companySafeBalance || 0}
        onSave={handleSaveCompanySafe}
      />
    </Box>
  );
};

export default DashboardPage;
