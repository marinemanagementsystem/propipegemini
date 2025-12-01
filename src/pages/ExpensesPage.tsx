import React, { useEffect, useState } from 'react';
import {
      Container,
      Typography,
      Button,
      Grid,
      Card,
      CardContent,
      Table,
      TableBody,
      TableCell,
      TableContainer,
      TableHead,
      TableRow,
      Paper,
      Chip,
      IconButton,
      Box,
      FormControl,
      InputLabel,
      Select,
      MenuItem,
      TextField,
      ToggleButton,
      ToggleButtonGroup,
      Stack,
      Avatar,
      Tabs,
      Tab,
      alpha,
      InputAdornment,
      Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FlightIcon from '@mui/icons-material/Flight';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BusinessIcon from '@mui/icons-material/Business';
import LogoutIcon from '@mui/icons-material/Logout';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';

import { getExpenses, createExpense, updateExpense, deleteExpense, hardDeleteExpense } from '../services/expenses';
import type { Expense, ExpenseFormData } from '../types/Expense';
import ExpenseFormModal from '../components/ExpenseFormModal';
import ExpenseHistoryModal from '../components/ExpenseHistoryModal';
import { seedData } from '../utils/seedData';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ExpensesPage: React.FC = () => {
      const [expenses, setExpenses] = useState<Expense[]>([]);
      const [loading, setLoading] = useState(false);
      const theme = useTheme();
      const isDark = theme.palette.mode === 'dark';

      // Auth
      const { currentUserAuth, currentUserProfile, logout } = useAuth();
      const navigate = useNavigate();

      // Filters
      const [startDate, setStartDate] = useState<Date | null>(null);
      const [endDate, setEndDate] = useState<Date | null>(null);
      const [filterType, setFilterType] = useState<string>('ALL');
      const [filterStatus, setFilterStatus] = useState<string>('ALL');
      const [filterOwner, setFilterOwner] = useState<string>('ALL'); // NEW: Owner Filter

      // View Mode & Tabs
      const [viewMode, setViewMode] = useState<'TABLE' | 'SIMPLE'>('SIMPLE');
      const [tabValue, setTabValue] = useState(0); // 0: Active, 1: Deleted

      // Modal State
      const [modalOpen, setModalOpen] = useState(false);
      const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
      const [submitting, setSubmitting] = useState(false);

      // History Modal
      const [historyModalOpen, setHistoryModalOpen] = useState(false);
      const [selectedExpenseIdForHistory, setSelectedExpenseIdForHistory] = useState<string | null>(null);

      // Summary Data
      const [summaryUnpaid, setSummaryUnpaid] = useState(0);
      const [summaryPaidThisMonth, setSummaryPaidThisMonth] = useState(0);

      const fetchData = async () => {
            setLoading(true);
            try {
                  const showDeleted = tabValue === 1;
                  const data = await getExpenses(startDate, endDate, filterType, filterStatus, showDeleted);
                  setExpenses(data);
                  // Summary calculation will be done in useEffect to respect owner filter
            } catch (error) {
                  console.error("Error fetching expenses:", error);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchData();
      }, [startDate, endDate, filterType, filterStatus, tabValue]);

      // Derived State: Filtered Expenses (Client-side Owner Filter)
      const displayedExpenses = expenses.filter(expense => {
            if (filterOwner === 'ALL') return true;
            return expense.ownerId === filterOwner;
      });

      // Derived State: Unique Owners for Dropdown
      const uniqueOwners = Array.from(new Set(expenses.map(e => e.ownerId))).filter(Boolean).sort();

      useEffect(() => {
            // Recalculate summary whenever displayedExpenses changes
            if (tabValue === 0) {
                  calculateSummary(displayedExpenses);
            }
      }, [displayedExpenses, tabValue]);

      const calculateSummary = (data: Expense[]) => {
            // Summary 1: Total UNPAID
            const unpaidTotal = data
                  .filter(e => e.status === 'UNPAID')
                  .reduce((sum, e) => sum + e.amount, 0);
            setSummaryUnpaid(unpaidTotal);

            // Summary 2: Paid This Month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const paidThisMonthTotal = data
                  .filter(e => {
                        const d = e.date.toDate();
                        return e.status === 'PAID' && d >= startOfMonth && d <= endOfMonth;
                  })
                  .reduce((sum, e) => sum + e.amount, 0);
            setSummaryPaidThisMonth(paidThisMonthTotal);
      };

      const handleLogout = async () => {
            await logout();
            navigate('/login');
      };

      const handleCreate = () => {
            setEditingExpense(null);
            setModalOpen(true);
      };

      const handleEdit = (expense: Expense) => {
            setEditingExpense(expense);
            setModalOpen(true);
      };

      const handleDelete = async (id: string) => {
            if (window.confirm("Bu gideri silmek istediğinizden emin misiniz? (Geri Dönüşüm Kutusuna taşınacak)")) {
                  try {
                        const user = currentUserAuth ? {
                              uid: currentUserAuth.uid,
                              email: currentUserAuth.email,
                              displayName: currentUserProfile?.displayName
                        } : undefined;

                        await deleteExpense(id, user);
                        fetchData();
                  } catch (error) {
                        console.error("Error deleting expense:", error);
                        alert("Silme işlemi başarısız oldu.");
                  }
            }
      };

      const handleHardDelete = async (id: string) => {
            if (window.confirm("DİKKAT: Bu gider KALICI OLARAK silinecek! Geri alınamaz. Emin misiniz?")) {
                  try {
                        await hardDeleteExpense(id);
                        fetchData();
                  } catch (error) {
                        console.error("Error hard deleting expense:", error);
                        alert("Kalıcı silme işlemi başarısız oldu.");
                  }
            }
      };

      const handleHistory = (id: string) => {
            setSelectedExpenseIdForHistory(id);
            setHistoryModalOpen(true);
      };

      const handleFormSubmit = async (data: ExpenseFormData) => {
            setSubmitting(true);
            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email,
                        displayName: currentUserProfile?.displayName
                  } : undefined;

                  if (editingExpense) {
                        await updateExpense(editingExpense.id, data, user);
                  } else {
                        await createExpense(data, user);
                  }
                  setModalOpen(false);
                  fetchData();
            } catch (error) {
                  console.error("Error saving expense:", error);
                  alert("Kaydetme işlemi başarısız oldu.");
            } finally {
                  setSubmitting(false);
            }
      };

      const handleViewChange = (_event: React.MouseEvent<HTMLElement>, newView: 'TABLE' | 'SIMPLE' | null) => {
            if (newView !== null) {
                  setViewMode(newView);
            }
      };

      const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
            setTabValue(newValue);
      };

      const handleImportData = async () => {
            if (window.confirm("Örnek veriler yüklenecek. Onaylıyor musunuz?")) {
                  setLoading(true);
                  try {
                        const user = currentUserAuth ? {
                              uid: currentUserAuth.uid,
                              email: currentUserAuth.email,
                              displayName: currentUserProfile?.displayName
                        } : undefined;

                        for (const data of seedData) {
                              await createExpense(data, user);
                        }
                        alert("Veriler başarıyla yüklendi!");
                        fetchData();
                  } catch (error) {
                        console.error("Error importing data:", error);
                        alert("Veri yükleme sırasında hata oluştu.");
                  } finally {
                        setLoading(false);
                  }
            }
      };

      const formatDate = (date: any) => {
            if (!date) return '-';
            const d = date.toDate ? date.toDate() : new Date(date);
            return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      };

      const getTypeLabel = (type: string) => {
            switch (type) {
                  case 'COMPANY_OFFICIAL': return 'Şirket Resmi';
                  case 'PERSONAL': return 'Kişisel';
                  case 'ADVANCE': return 'Avans';
                  default: return type;
            }
      };

      const getCategoryIcon = (description: string) => {
            const desc = description.toLowerCase();
            if (desc.includes('uçak') || desc.includes('bilet') || desc.includes('seyahat')) return <FlightIcon />;
            if (desc.includes('market') || desc.includes('alışveriş') || desc.includes('malzeme')) return <ShoppingCartIcon />;
            if (desc.includes('yemek') || desc.includes('restoran')) return <RestaurantIcon />;
            if (desc.includes('yakıt') || desc.includes('araç') || desc.includes('taksi')) return <DirectionsCarIcon />;
            return <BusinessIcon />;
      };

      return (
            <Box sx={{ minHeight: '100vh', pb: 6 }}>
                  {/* Hero Section */}
                  <Box 
                        sx={{ 
                              background: isDark 
                                    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.3)} 0%, ${alpha('#0f172a', 0.9)} 100%)`
                                    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              pt: 4,
                              pb: 5,
                        }}
                  >
                        <Container maxWidth="xl">
                              {/* Header */}
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3} mb={4}>
                                    <Box>
                                          <Typography 
                                                variant="h3" 
                                                fontWeight={800} 
                                                sx={{ 
                                                      mb: 1,
                                                      background: isDark 
                                                            ? `linear-gradient(135deg, #fff 0%, ${theme.palette.primary.light} 100%)`
                                                            : `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.primary.main} 100%)`,
                                                      backgroundClip: 'text',
                                                      WebkitBackgroundClip: 'text',
                                                      WebkitTextFillColor: 'transparent',
                                                }}
                                          >
                                                Giderler
                                          </Typography>
                                          <Typography variant="body1" color="text.secondary">
                                                Tüm şirket giderlerinizi takip edin ve yönetin
                                          </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={2} flexWrap="wrap">
                                          <ToggleButtonGroup
                                                value={viewMode}
                                                exclusive
                                                onChange={handleViewChange}
                                                aria-label="görünüm"
                                                size="small"
                                                sx={{ 
                                                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                      borderRadius: 2,
                                                      '& .MuiToggleButton-root': {
                                                            border: 'none',
                                                            px: 2,
                                                      },
                                                }}
                                          >
                                                <ToggleButton value="TABLE" aria-label="tablo görünümü">
                                                      <ViewListIcon sx={{ mr: 0.5 }} fontSize="small" /> Tablo
                                                </ToggleButton>
                                                <ToggleButton value="SIMPLE" aria-label="sade görünüm">
                                                      <ViewModuleIcon sx={{ mr: 0.5 }} fontSize="small" /> Kartlar
                                                </ToggleButton>
                                          </ToggleButtonGroup>
                                          <Tooltip title="Örnek veri yükle">
                                                <Button
                                                      variant="outlined"
                                                      startIcon={<CloudUploadIcon />}
                                                      onClick={handleImportData}
                                                      sx={{ 
                                                            borderColor: alpha(theme.palette.divider, 0.3),
                                                            color: 'text.secondary',
                                                            '&:hover': {
                                                                  borderColor: theme.palette.primary.main,
                                                                  color: 'primary.main',
                                                            },
                                                      }}
                                                >
                                                      İçe Aktar
                                                </Button>
                                          </Tooltip>
                                          <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={handleCreate}
                                                sx={{ 
                                                      px: 4,
                                                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                                }}
                                          >
                                                Yeni Gider
                                          </Button>
                                    </Stack>
                              </Box>

                              {/* Summary Cards */}
                              {tabValue === 0 && (
                                    <Grid container spacing={3}>
                                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Paper 
                                                      elevation={0}
                                                      sx={{ 
                                                            p: 3, 
                                                            borderRadius: 4,
                                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                                                            backdropFilter: 'blur(8px)',
                                                      }}
                                                >
                                                      <Box display="flex" alignItems="center" gap={2}>
                                                            <Box 
                                                                  sx={{ 
                                                                        width: 48, 
                                                                        height: 48, 
                                                                        borderRadius: 3,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <WarningAmberIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h5" fontWeight={700} color="warning.main">
                                                                        {summaryUnpaid.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                                                  </Typography>
                                                                  <Typography variant="body2" color="text.secondary">
                                                                        Bekleyen Ödemeler
                                                                  </Typography>
                                                            </Box>
                                                      </Box>
                                                </Paper>
                                          </Grid>
                                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Paper 
                                                      elevation={0}
                                                      sx={{ 
                                                            p: 3, 
                                                            borderRadius: 4,
                                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                                                            backdropFilter: 'blur(8px)',
                                                      }}
                                                >
                                                      <Box display="flex" alignItems="center" gap={2}>
                                                            <Box 
                                                                  sx={{ 
                                                                        width: 48, 
                                                                        height: 48, 
                                                                        borderRadius: 3,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h5" fontWeight={700} color="success.main">
                                                                        {summaryPaidThisMonth.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                                                  </Typography>
                                                                  <Typography variant="body2" color="text.secondary">
                                                                        Bu Ay Ödenen
                                                                  </Typography>
                                                            </Box>
                                                      </Box>
                                                </Paper>
                                          </Grid>
                                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Paper 
                                                      elevation={0}
                                                      sx={{ 
                                                            p: 3, 
                                                            borderRadius: 4,
                                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                                                            backdropFilter: 'blur(8px)',
                                                      }}
                                                >
                                                      <Box display="flex" alignItems="center" gap={2}>
                                                            <Box 
                                                                  sx={{ 
                                                                        width: 48, 
                                                                        height: 48, 
                                                                        borderRadius: 3,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <ReceiptIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h5" fontWeight={700}>
                                                                        {displayedExpenses.length}
                                                                  </Typography>
                                                                  <Typography variant="body2" color="text.secondary">
                                                                        Toplam Kayıt
                                                                  </Typography>
                                                            </Box>
                                                      </Box>
                                                </Paper>
                                          </Grid>
                                          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                                <Paper 
                                                      elevation={0}
                                                      sx={{ 
                                                            p: 3, 
                                                            borderRadius: 4,
                                                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                                                            backdropFilter: 'blur(8px)',
                                                      }}
                                                >
                                                      <Box display="flex" alignItems="center" gap={2}>
                                                            <Box 
                                                                  sx={{ 
                                                                        width: 48, 
                                                                        height: 48, 
                                                                        borderRadius: 3,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <TrendingDownIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h5" fontWeight={700} color="error.main">
                                                                        {displayedExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                                                  </Typography>
                                                                  <Typography variant="body2" color="text.secondary">
                                                                        Toplam Gider
                                                                  </Typography>
                                                            </Box>
                                                      </Box>
                                                </Paper>
                                          </Grid>
                                    </Grid>
                              )}
                        </Container>
                  </Box>

                  <Container maxWidth="xl" sx={{ mt: 4 }}>
                        {/* Tabs */}
                        <Paper 
                              elevation={0} 
                              sx={{ 
                                    mb: 3, 
                                    borderRadius: 3,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    overflow: 'hidden',
                              }}
                        >
                              <Tabs 
                                    value={tabValue} 
                                    onChange={handleTabChange}
                                    sx={{
                                          bgcolor: alpha(theme.palette.background.paper, 0.8),
                                          '& .MuiTab-root': {
                                                py: 2,
                                          },
                                    }}
                              >
                                    <Tab label="Aktif Giderler" icon={<ReceiptIcon />} iconPosition="start" />
                                    <Tab label="Silinen Giderler" icon={<DeleteIcon />} iconPosition="start" />
                              </Tabs>
                        </Paper>

                        {/* Filters */}
                        <Paper 
                              elevation={0}
                              sx={{ 
                                    p: 3, 
                                    mb: 3, 
                                    borderRadius: 3,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              }}
                        >
                              <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <FilterListIcon sx={{ color: 'text.secondary' }} />
                                    <Typography variant="subtitle1" fontWeight={600}>
                                          Filtreler
                                    </Typography>
                              </Box>
                              <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                          <TextField
                                                label="Başlangıç Tarihi"
                                                type="date"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                                value={startDate ? startDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                                                size="small"
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                          <TextField
                                                label="Bitiş Tarihi"
                                                type="date"
                                                fullWidth
                                                InputLabelProps={{ shrink: true }}
                                                value={endDate ? endDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                                                size="small"
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                                          <FormControl fullWidth size="small">
                                                <InputLabel>Gider Türü</InputLabel>
                                                <Select
                                                      value={filterType}
                                                      label="Gider Türü"
                                                      onChange={(e) => setFilterType(e.target.value)}
                                                >
                                                      <MenuItem value="ALL">Tümü</MenuItem>
                                                      <MenuItem value="COMPANY_OFFICIAL">Şirket Resmi</MenuItem>
                                                      <MenuItem value="PERSONAL">Kişisel</MenuItem>
                                                      <MenuItem value="ADVANCE">Avans</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                                          <FormControl fullWidth size="small">
                                                <InputLabel>Ödeme Durumu</InputLabel>
                                                <Select
                                                      value={filterStatus}
                                                      label="Ödeme Durumu"
                                                      onChange={(e) => setFilterStatus(e.target.value)}
                                                >
                                                      <MenuItem value="ALL">Tümü</MenuItem>
                                                      <MenuItem value="PAID">Ödendi</MenuItem>
                                                      <MenuItem value="UNPAID">Ödenmedi</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                                          <FormControl fullWidth size="small">
                                                <InputLabel>Gider Sahibi</InputLabel>
                                                <Select
                                                      value={filterOwner}
                                                      label="Gider Sahibi"
                                                      onChange={(e) => setFilterOwner(e.target.value)}
                                                >
                                                      <MenuItem value="ALL">Tümü</MenuItem>
                                                      {uniqueOwners.map(owner => (
                                                            <MenuItem key={owner} value={owner}>{owner}</MenuItem>
                                                      ))}
                                                </Select>
                                          </FormControl>
                                    </Grid>
                              </Grid>
                        </Paper>

                        {/* Content Area */}
                        {viewMode === 'TABLE' ? (
                              <TableContainer 
                                    component={Paper} 
                                    elevation={0} 
                                    sx={{ 
                                          borderRadius: 3, 
                                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                    }}
                              >
                                    <Table>
                                          <TableHead>
                                                <TableRow>
                                                      <TableCell>Tarih</TableCell>
                                                      <TableCell>Açıklama</TableCell>
                                                      <TableCell>Tutar</TableCell>
                                                      <TableCell>Tür</TableCell>
                                                      <TableCell>Durum</TableCell>
                                                      <TableCell>Gider Sahibi</TableCell>
                                                      <TableCell>Ödeme Şekli</TableCell>
                                                      <TableCell>Dekont</TableCell>
                                                      <TableCell align="right">İşlemler</TableCell>
                                                </TableRow>
                                          </TableHead>
                                          <TableBody>
                                                {displayedExpenses.map((expense) => (
                                                      <TableRow key={expense.id} hover>
                                                            <TableCell>{formatDate(expense.date)}</TableCell>
                                                            <TableCell>
                                                                  <Stack direction="row" alignItems="center" spacing={1.5}>
                                                                        <Avatar 
                                                                              sx={{ 
                                                                                    width: 32, 
                                                                                    height: 32, 
                                                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                                    color: 'primary.main',
                                                                              }}
                                                                        >
                                                                              {getCategoryIcon(expense.description)}
                                                                        </Avatar>
                                                                        <Typography variant="body2" fontWeight={500}>
                                                                              {expense.description}
                                                                        </Typography>
                                                                  </Stack>
                                                            </TableCell>
                                                            <TableCell>
                                                                  <Typography fontWeight={700}>
                                                                        {expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {expense.currency === 'TRY' ? '₺' : expense.currency}
                                                                  </Typography>
                                                            </TableCell>
                                                      <TableCell>{getTypeLabel(expense.type)}</TableCell>
                                                      <TableCell>
                                                            <Chip
                                                                  label={expense.status === 'PAID' ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                                                                  color={expense.status === 'PAID' ? 'success' : 'warning'}
                                                                  size="small"
                                                                  variant="filled"
                                                                  sx={{
                                                                        bgcolor: expense.status === 'PAID' ? '#e8f5e9' : '#fff3e0',
                                                                        color: expense.status === 'PAID' ? '#2e7d32' : '#ef6c00',
                                                                        fontWeight: 'bold'
                                                                  }}
                                                            />
                                                      </TableCell>
                                                      <TableCell>{expense.ownerId}</TableCell>
                                                      <TableCell>{expense.paymentMethod}</TableCell>
                                                      <TableCell>
                                                            {expense.receiptUrl && (
                                                                  <IconButton size="small" href={expense.receiptUrl} target="_blank" color="primary">
                                                                        <ReceiptIcon />
                                                                  </IconButton>
                                                            )}
                                                      </TableCell>
                                                      <TableCell>
                                                            <Stack direction="row">
                                                                  <IconButton size="small" onClick={() => handleHistory(expense.id)} title="Geçmiş">
                                                                        <HistoryIcon fontSize="small" />
                                                                  </IconButton>

                                                                  {tabValue === 0 && (
                                                                        <>
                                                                              <IconButton size="small" onClick={() => handleEdit(expense)} title="Düzenle">
                                                                                    <EditIcon fontSize="small" />
                                                                              </IconButton>
                                                                              <IconButton size="small" onClick={() => handleDelete(expense.id)} color="error" title="Sil">
                                                                                    <DeleteIcon fontSize="small" />
                                                                              </IconButton>
                                                                        </>
                                                                  )}

                                                                  {tabValue === 1 && currentUserProfile?.role === 'ADMIN' && (
                                                                        <IconButton size="small" onClick={() => handleHardDelete(expense.id)} color="error" title="Kalıcı Sil">
                                                                              <DeleteForeverIcon fontSize="small" />
                                                                        </IconButton>
                                                                  )}
                                                            </Stack>
                                                      </TableCell>
                                                </TableRow>
                                          ))}
                                          {displayedExpenses.length === 0 && !loading && (
                                                <TableRow>
                                                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                                            <Typography color="textSecondary">Kayıt bulunamadı.</Typography>
                                                      </TableCell>
                                                </TableRow>
                                          )}
                                    </TableBody>
                              </Table>
                        </TableContainer>
                  ) : (
                        <Stack spacing={2}>
                              {displayedExpenses.map((expense) => (
                                    <Paper key={expense.id} sx={{ p: 2, borderRadius: 3, border: '1px solid #f0f0f0', bgcolor: expense.isDeleted ? '#fff5f5' : 'inherit' }} elevation={0}>
                                          <Grid container alignItems="center" spacing={2}>
                                                <Grid>
                                                      <Avatar sx={{
                                                            bgcolor: expense.status === 'PAID' ? '#e0f2f1' : '#fff3e0',
                                                            color: expense.status === 'PAID' ? '#00695c' : '#ef6c00',
                                                            width: 48,
                                                            height: 48
                                                      }}>
                                                            {getCategoryIcon(expense.description)}
                                                      </Avatar>
                                                </Grid>
                                                <Grid size="grow">
                                                      <Typography variant="subtitle1" fontWeight="bold">
                                                            {expense.description}
                                                      </Typography>
                                                      <Typography variant="body2" color="textSecondary">
                                                            {formatDate(expense.date)} • {expense.ownerId}
                                                      </Typography>
                                                </Grid>
                                                <Grid sx={{ textAlign: 'right' }}>
                                                      <Typography variant="h6" fontWeight="bold">
                                                            {expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {expense.currency}
                                                      </Typography>
                                                      <Chip
                                                            label={expense.status === 'PAID' ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                                                            size="small"
                                                            sx={{
                                                                  bgcolor: expense.status === 'PAID' ? '#e8f5e9' : '#fff3e0',
                                                                  color: expense.status === 'PAID' ? '#2e7d32' : '#ef6c00',
                                                                  fontWeight: 'bold',
                                                                  height: 24
                                                            }}
                                                      />
                                                </Grid>
                                                <Grid>
                                                      <IconButton size="small" onClick={() => handleHistory(expense.id)} title="Geçmiş">
                                                            <HistoryIcon fontSize="small" />
                                                      </IconButton>

                                                      {tabValue === 0 && (
                                                            <>
                                                                  <IconButton size="small" onClick={() => handleEdit(expense)} title="Düzenle">
                                                                        <EditIcon fontSize="small" />
                                                                  </IconButton>
                                                                  <IconButton size="small" color="error" onClick={() => handleDelete(expense.id)} title="Sil">
                                                                        <DeleteIcon fontSize="small" />
                                                                  </IconButton>
                                                            </>
                                                      )}

                                                      {tabValue === 1 && currentUserProfile?.role === 'ADMIN' && (
                                                            <IconButton size="small" onClick={() => handleHardDelete(expense.id)} color="error" title="Kalıcı Sil">
                                                                  <DeleteForeverIcon fontSize="small" />
                                                            </IconButton>
                                                      )}
                                                </Grid>
                                          </Grid>
                                    </Paper>
                              ))}
                              {displayedExpenses.length === 0 && !loading && (
                                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                                          <Typography color="textSecondary">Kayıt bulunamadı.</Typography>
                                    </Paper>
                              )}
                        </Stack>
                  )}

                  <ExpenseFormModal
                        open={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onSubmit={handleFormSubmit}
                        initialData={editingExpense}
                        loading={submitting}
                  />

                  <ExpenseHistoryModal
                        open={historyModalOpen}
                        onClose={() => setHistoryModalOpen(false)}
                        expenseId={selectedExpenseIdForHistory}
                        onRevertSuccess={fetchData}
                  />
                  </Container>
            </Box>
      );
};

export default ExpensesPage;
