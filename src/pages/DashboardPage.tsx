import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
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
  LinearProgress,
  Paper,
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
  Refresh as RefreshIcon,
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

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentUserAuth } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const surfaceBorder = alpha(
    theme.palette.mode === 'dark' ? '#a5b4fc' : '#0f172a',
    theme.palette.mode === 'dark' ? 0.2 : 0.1
  );
  const glassPanelSx = {
    p: { xs: 2.5, md: 3 },
    borderRadius: 4,
    border: `1px solid ${surfaceBorder}`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
    background: theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
      : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(245,248,255,0.94))',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 24px 60px rgba(0, 0, 0, 0.45)'
      : '0 24px 60px rgba(15, 23, 42, 0.08)',
  };
  const statCardStyle = (color: string) => ({
    ...glassPanelSx,
    height: '100%',
    background: `linear-gradient(135deg, ${alpha(color, 0.18)} 0%, ${alpha(color, 0.06)} 100%)`,
    border: `1px solid ${alpha(color, 0.32)}`,
  });

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [expensesTrend, setExpensesTrend] = useState<MonthlyTrendItem[]>([]);
  const [statementsTrend, setStatementsTrend] = useState<StatementTrendItem[]>([]);
  const [networkActions, setNetworkActions] = useState<NetworkActionItem[]>([]);
  const [latestExpenses, setLatestExpenses] = useState<Expense[]>([]);
  const [latestStatements, setLatestStatements] = useState<StatementWithProject[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [safeModalOpen, setSafeModalOpen] = useState(false);

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

  const handleSaveCompanySafe = async (newBalance: number) => {
    await updateCompanyOverview(
      { companySafeBalance: newBalance },
      currentUserAuth ? {
        uid: currentUserAuth.uid,
        email: currentUserAuth.email || '',
        displayName: currentUserAuth.displayName || '',
      } : undefined
    );
    const newSummary = await getDashboardSummary();
    setSummary(newSummary);
  };

  const expenseChartColor = theme.palette.error.main;
  const statementChartColor = theme.palette.success.main;
  const statCards = [
    {
      title: 'Şirket Kasası',
      subtitle: summary?.lastUpdatedAt ? `Son güncelleme: ${formatDate(summary.lastUpdatedAt)}` : 'Toplam banka + nakit',
      value: formatCurrency(summary?.companySafeBalance || 0, summary?.currency),
      color: theme.palette.primary.main,
      icon: <AccountBalanceIcon />, 
      action: () => setSafeModalOpen(true),
    },
    {
      title: 'Tersanelerde Bekleyen',
      subtitle: `Toplam ${summary?.totalProjectsCount || 0} tersane`,
      value: formatCurrency(summary?.totalProjectsBalance || 0),
      color: theme.palette.info.main,
      icon: <BusinessIcon />, 
    },
    {
      title: 'Bu Ay Ödenen Giderler',
      subtitle: 'Sadece ödenen giderler',
      value: formatCurrency(summary?.totalPaidExpensesThisMonth || 0),
      color: theme.palette.error.main,
      icon: <ReceiptIcon />, 
    },
    {
      title: 'Ortak Hesap Özeti',
      subtitle: 'Net durum',
      value: formatCurrency((summary?.totalPartnersNegative || 0) - (summary?.totalPartnersPositive || 0)),
      color: theme.palette.warning.main,
      icon: <PeopleIcon />, 
      extra: (
        <Box sx={{ display: 'grid', gap: 0.5, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingDownIcon fontSize="small" color="error" />
            <Typography variant="body2" color="text.secondary">
              Şirketin borcu
            </Typography>
            <Typography variant="body2" fontWeight={700} color="error.main">
              {formatCurrency(summary?.totalPartnersPositive || 0)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon fontSize="small" color="success" />
            <Typography variant="body2" color="text.secondary">
              Ortakların borcu
            </Typography>
            <Typography variant="body2" fontWeight={700} color="success.main">
              {formatCurrency(summary?.totalPartnersNegative || 0)}
            </Typography>
          </Box>
        </Box>
      ),
    },
  ];

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
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: theme.palette.mode === 'dark' ? 0.18 : 0.1,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `
            radial-gradient(800px 800px at 12% 20%, ${alpha(theme.palette.primary.main, 0.14)}, transparent),
            radial-gradient(900px 900px at 82% 0%, ${alpha(theme.palette.info.main, 0.16)}, transparent),
            radial-gradient(700px 700px at 50% 90%, ${alpha(theme.palette.success.main, 0.12)}, transparent)
          `,
          opacity: 0.8,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: '0.16em', color: 'text.secondary' }}>
              Kontrol Merkezi
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
              Ana Kumanda Paneli
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Finans, network ve proje görünümünü tek ekranda takip edin.
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`Kasada ${formatCurrency(summary?.companySafeBalance || 0, summary?.currency)}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
              <Chip
                label={`${networkActions.length || 0} bekleyen aksiyon`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Yenile
            </Button>
            <Button variant="contained" onClick={() => setSafeModalOpen(true)} sx={{ borderRadius: 2 }}>
              Kasayı Güncelle
            </Button>
          </Box>
        </Box>

        {loading && (
          <LinearProgress
            sx={{
              mb: 3,
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            }}
          />
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          {statCards.map((card) => (
            <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={0} sx={statCardStyle(card.color)}>
                <CardContent sx={{ p: { xs: 2.25, md: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: 'grid',
                          placeItems: 'center',
                          backgroundColor: alpha(card.color, 0.12),
                          color: card.color,
                          boxShadow: `0 12px 30px ${alpha(card.color, 0.2)}`,
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {card.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {card.subtitle}
                        </Typography>
                      </Box>
                    </Box>
                    {card.action && (
                      <Tooltip title="Düzenle">
                        <IconButton size="small" onClick={card.action} sx={{ color: card.color }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="h4" fontWeight={800} sx={{ color: card.color, mb: card.extra ? 1 : 0 }}>
                    {card.value}
                  </Typography>
                  {card.extra}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...glassPanelSx, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: 'text.secondary' }}>
                    Giderler
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    Son 6 Ay Ödenen Giderler
                  </Typography>
                </Box>
                <Chip label="Trend" size="small" color="error" variant="outlined" />
              </Box>
              <Box sx={{ height: 300 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                        {expensesTrend.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={alpha(expenseChartColor, 0.7 + index * 0.05)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...glassPanelSx, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: 'text.secondary' }}>
                    Hakediş
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    Son 6 Ay Hakediş Net Sonuçları
                  </Typography>
                </Box>
                <Chip label="Net" size="small" color="success" variant="outlined" />
              </Box>
              <Box sx={{ height: 300 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Bar dataKey="totalNetCash" radius={[6, 6, 0, 0]}>
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
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...glassPanelSx, height: isMobile ? 'auto' : 400 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: 'text.secondary' }}>
                    Network
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    Bugün / Yakında Aranacak Firmalar
                  </Typography>
                </Box>
                <Button size="small" onClick={() => navigate('/network')}>
                  Tümünü Gör
                </Button>
              </Box>
              
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                  <CircularProgress />
                </Box>
              ) : networkActions.length === 0 ? (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={260}>
                  <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    Yaklaşan aksiyon bulunmuyor
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 1.5, maxHeight: 300, overflowY: 'auto', pr: 0.5 }}>
                  {networkActions.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 3,
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        backgroundColor: item.isOverdue ? alpha(theme.palette.error.main, 0.06) : alpha(theme.palette.primary.main, 0.04),
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => navigate('/network')}
                    >
                      <Box sx={{ display: 'grid', gap: 0.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.isOverdue && (
                            <Tooltip title="Gecikmiş">
                              <WarningIcon fontSize="small" color="error" />
                            </Tooltip>
                          )}
                          <Typography variant="body1" fontWeight={700}>
                            {item.companyName}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.75} color="text.secondary">
                          <Typography variant="body2">{item.contactPerson}</Typography>
                          {item.phone && (
                            <Tooltip title={item.phone}>
                              <PhoneIcon fontSize="small" color="action" />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="body2" 
                          color={item.isOverdue ? 'error.main' : 'text.primary'}
                          fontWeight={item.isOverdue ? 'bold' : 600}
                        >
                          {formatDateShort(item.nextActionDate)}
                        </Typography>
                        <Chip
                          label={getQuoteStatusLabelTR(item.quoteStatus)}
                          size="small"
                          variant="outlined"
                          color={
                            item.quoteStatus === 'TEKLIF_VERILDI' ? 'success' :
                            item.quoteStatus === 'GORUSME_DEVAM_EDIYOR' ? 'info' :
                            'default'
                          }
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} sx={{ ...glassPanelSx, height: isMobile ? 'auto' : 400 }}>
              <Typography variant="overline" sx={{ letterSpacing: '0.12em', color: 'text.secondary' }}>
                Hareketler
              </Typography>
              <Typography variant="h6" fontWeight={700} mb={2}>
                Son Hareketler
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 2, maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Son 5 Gider
                    </Typography>
                    {latestExpenses.length === 0 ? (
                      <Typography variant="body2" color="text.disabled" sx={{ mb: 2, fontStyle: 'italic' }}>
                        Gider kaydı bulunmuyor
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {latestExpenses.map((expense) => (
                          <Box
                            key={expense.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.25,
                              borderRadius: 3,
                              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                              backgroundColor: alpha(theme.palette.error.main, 0.04),
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': { borderColor: alpha(theme.palette.error.main, 0.5), transform: 'translateY(-2px)' },
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
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Son 5 Kapatılan Hakediş
                    </Typography>
                    {latestStatements.length === 0 ? (
                      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        Kapatılmış hakediş bulunmuyor
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {latestStatements.map((statement) => (
                          <Box
                            key={statement.id}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.25,
                              borderRadius: 3,
                              border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                              backgroundColor: alpha(theme.palette.success.main, 0.04),
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': { borderColor: alpha(theme.palette.success.main, 0.5), transform: 'translateY(-2px)' },
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
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        <SafeEditModal
          open={safeModalOpen}
          onClose={() => setSafeModalOpen(false)}
          currentBalance={summary?.companySafeBalance || 0}
          onSave={handleSaveCompanySafe}
        />
      </Box>
    </Box>
  );
};

export default DashboardPage;
