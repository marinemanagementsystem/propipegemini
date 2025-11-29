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
      Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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

import { getExpenses, createExpense, updateExpense, deleteExpense } from '../services/expenses';
import type { Expense, ExpenseFormData } from '../types/Expense';
import ExpenseFormModal from '../components/ExpenseFormModal';
import { seedData } from '../utils/seedData';

const ExpensesPage: React.FC = () => {
      const [expenses, setExpenses] = useState<Expense[]>([]);
      const [loading, setLoading] = useState(false);

      // Filters
      const [startDate, setStartDate] = useState<Date | null>(null);
      const [endDate, setEndDate] = useState<Date | null>(null);
      const [filterType, setFilterType] = useState<string>('ALL');
      const [filterStatus, setFilterStatus] = useState<string>('ALL');

      // View Mode
      const [viewMode, setViewMode] = useState<'TABLE' | 'SIMPLE'>('SIMPLE'); // Default to SIMPLE for better UI showcase

      // Modal State
      const [modalOpen, setModalOpen] = useState(false);
      const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
      const [submitting, setSubmitting] = useState(false);

      // Summary Data
      const [summaryUnpaid, setSummaryUnpaid] = useState(0);
      const [summaryPaidThisMonth, setSummaryPaidThisMonth] = useState(0);

      const fetchData = async () => {
            setLoading(true);
            try {
                  const data = await getExpenses(startDate, endDate, filterType, filterStatus);
                  setExpenses(data);
                  calculateSummary(data);
            } catch (error) {
                  console.error("Error fetching expenses:", error);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchData();
      }, [startDate, endDate, filterType, filterStatus]);

      const calculateSummary = (data: Expense[]) => {
            // Summary 1: Total UNPAID (PERSONAL or ADVANCE)
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

      const handleCreate = () => {
            setEditingExpense(null);
            setModalOpen(true);
      };

      const handleEdit = (expense: Expense) => {
            setEditingExpense(expense);
            setModalOpen(true);
      };

      const handleDelete = async (id: string) => {
            if (window.confirm("Bu gider kaydını silmek istediğinden emin misin?")) {
                  try {
                        await deleteExpense(id);
                        fetchData();
                  } catch (error) {
                        console.error("Error deleting expense:", error);
                        alert("Silme işlemi başarısız oldu.");
                  }
            }
      };

      const handleFormSubmit = async (data: ExpenseFormData) => {
            setSubmitting(true);
            try {
                  if (editingExpense) {
                        await updateExpense(editingExpense.id, data);
                  } else {
                        await createExpense(data);
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

      const handleImportData = async () => {
            if (window.confirm("Örnek veriler yüklenecek. Onaylıyor musunuz?")) {
                  setLoading(true);
                  try {
                        for (const data of seedData) {
                              await createExpense(data);
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
            // Handle Firestore Timestamp or JS Date
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
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                              Giderler
                        </Typography>
                        <Stack direction="row" spacing={2}>
                              <ToggleButtonGroup
                                    value={viewMode}
                                    exclusive
                                    onChange={handleViewChange}
                                    aria-label="görünüm"
                                    size="small"
                                    sx={{ bgcolor: 'background.paper' }}
                              >
                                    <ToggleButton value="TABLE" aria-label="tablo görünümü">
                                          <ViewListIcon sx={{ mr: 1 }} /> Tablo
                                    </ToggleButton>
                                    <ToggleButton value="SIMPLE" aria-label="sade görünüm">
                                          <ViewModuleIcon sx={{ mr: 1 }} /> Kartlar
                                    </ToggleButton>
                              </ToggleButtonGroup>
                              <Button
                                    variant="outlined"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={handleImportData}
                                    color="secondary"
                              >
                                    Verileri Yükle
                              </Button>
                              <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleCreate}
                                    sx={{ px: 3 }}
                              >
                                    Yeni
                              </Button>
                        </Stack>
                  </Box>

                  {/* Summary Cards */}
                  <Grid container spacing={3} mb={4}>
                        <Grid size={{ xs: 12, md: 6 }}>
                              <Card sx={{
                                    bgcolor: '#fff9c4', // Light yellow background
                                    border: '1px solid #ffe082',
                                    borderRadius: 4,
                                    position: 'relative',
                                    overflow: 'visible'
                              }}>
                                    <Box sx={{
                                          position: 'absolute',
                                          top: -10,
                                          left: 20,
                                          width: 40,
                                          height: 4,
                                          bgcolor: '#ffc107',
                                          borderRadius: 2
                                    }} />
                                    <CardContent sx={{ p: 3 }}>
                                          <Typography variant="h4" sx={{ color: '#ff6f00', fontWeight: 'bold', mb: 1 }}>
                                                {summaryUnpaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                          </Typography>
                                          <Typography variant="subtitle1" sx={{ color: '#ff8f00' }}>
                                                Toplam Ödenmedi
                                          </Typography>
                                    </CardContent>
                              </Card>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                              <Card sx={{
                                    bgcolor: '#e0f2f1', // Light cyan background
                                    border: '1px solid #80cbc4',
                                    borderRadius: 4,
                                    position: 'relative',
                                    overflow: 'visible'
                              }}>
                                    <Box sx={{
                                          position: 'absolute',
                                          top: -10,
                                          left: 20,
                                          width: 40,
                                          height: 4,
                                          bgcolor: '#00bfa5',
                                          borderRadius: 2
                                    }} />
                                    <CardContent sx={{ p: 3 }}>
                                          <Typography variant="h4" sx={{ color: '#00695c', fontWeight: 'bold', mb: 1 }}>
                                                {summaryPaidThisMonth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                          </Typography>
                                          <Typography variant="subtitle1" sx={{ color: '#00897b' }}>
                                                Bu Ay Ödenen
                                          </Typography>
                                    </CardContent>
                              </Card>
                        </Grid>
                  </Grid>

                  {/* Filters */}
                  <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }} elevation={0}>
                        <Grid container spacing={2} alignItems="center">
                              <Grid size={{ xs: 12, sm: 3 }}>
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
                              <Grid size={{ xs: 12, sm: 3 }}>
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
                              <Grid size={{ xs: 12, sm: 3 }}>
                                    <FormControl fullWidth size="small">
                                          <InputLabel>Tür: Şirket/Kişisel</InputLabel>
                                          <Select
                                                value={filterType}
                                                label="Tür: Şirket/Kişisel"
                                                onChange={(e) => setFilterType(e.target.value)}
                                          >
                                                <MenuItem value="ALL">Tümü</MenuItem>
                                                <MenuItem value="COMPANY_OFFICIAL">Şirket Resmi</MenuItem>
                                                <MenuItem value="PERSONAL">Kişisel</MenuItem>
                                                <MenuItem value="ADVANCE">Avans</MenuItem>
                                          </Select>
                                    </FormControl>
                              </Grid>
                              <Grid size={{ xs: 12, sm: 3 }}>
                                    <FormControl fullWidth size="small">
                                          <InputLabel>Durum: Ödendi/Ödenmedi</InputLabel>
                                          <Select
                                                value={filterStatus}
                                                label="Durum: Ödendi/Ödenmedi"
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                          >
                                                <MenuItem value="ALL">Tümü</MenuItem>
                                                <MenuItem value="PAID">Ödendi</MenuItem>
                                                <MenuItem value="UNPAID">Ödenmedi</MenuItem>
                                          </Select>
                                    </FormControl>
                              </Grid>
                        </Grid>
                  </Paper>

                  {/* Content Area */}
                  {viewMode === 'TABLE' ? (
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #eee' }}>
                              <Table>
                                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                                          <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Tarih</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Açıklama</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Tutar</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Tür</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Durum</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Gider Sahibi</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Ödeme Şekli</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Dekont</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
                                          </TableRow>
                                    </TableHead>
                                    <TableBody>
                                          {expenses.map((expense) => (
                                                <TableRow key={expense.id} hover>
                                                      <TableCell>{formatDate(expense.date)}</TableCell>
                                                      <TableCell>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                  <Avatar sx={{ bgcolor: 'primary.light', width: 24, height: 24, fontSize: 14 }}>
                                                                        {getCategoryIcon(expense.description)}
                                                                  </Avatar>
                                                                  <Typography variant="body2">{expense.description}</Typography>
                                                            </Stack>
                                                      </TableCell>
                                                      <TableCell sx={{ fontWeight: 'bold' }}>
                                                            {expense.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {expense.currency}
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
                                                                  <IconButton size="small" onClick={() => handleEdit(expense)}>
                                                                        <EditIcon fontSize="small" />
                                                                  </IconButton>
                                                                  <IconButton size="small" onClick={() => handleDelete(expense.id)} color="error">
                                                                        <DeleteIcon fontSize="small" />
                                                                  </IconButton>
                                                            </Stack>
                                                      </TableCell>
                                                </TableRow>
                                          ))}
                                          {expenses.length === 0 && !loading && (
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
                              {expenses.map((expense) => (
                                    <Paper key={expense.id} sx={{ p: 2, borderRadius: 3, border: '1px solid #f0f0f0' }} elevation={0}>
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
                                                      <IconButton size="small" onClick={() => handleEdit(expense)}>
                                                            <EditIcon fontSize="small" />
                                                      </IconButton>
                                                      <IconButton size="small" color="error" onClick={() => handleDelete(expense.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                      </IconButton>
                                                </Grid>
                                          </Grid>
                                    </Paper>
                              ))}
                              {expenses.length === 0 && !loading && (
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
            </Container>
      );
};

export default ExpensesPage;
