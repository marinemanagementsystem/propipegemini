import React, { useEffect, useState } from 'react';
import {
      Container,
      Typography,
      Button,
      Grid,
      Card,
      CardContent,
      Dialog,
      DialogTitle,
      DialogContent,
      DialogActions,
      TextField,
      CircularProgress,
      Box,
      IconButton,
      Table,
      TableBody,
      TableCell,
      TableContainer,
      TableHead,
      TableRow,
      Paper,
      MenuItem,
      Select,
      FormControl,
      InputLabel,
      Chip,
      Alert,
      useTheme,
      Tooltip,
      alpha
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import HistoryIcon from '@mui/icons-material/History';
import { useParams, useNavigate } from 'react-router-dom';
import {
      getProjectById,
      getStatementById,
      getStatementLines,
      createStatementLine,
      updateStatementLine,
      deleteStatementLine,
      updateStatement,
      closeStatement,
      getStatementsByProject,
      getStatementHistory
} from '../services/projects';
import type { Project, ProjectStatement, StatementLine, StatementHistoryEntry } from '../types/Project';
import { useAuth } from '../context/AuthContext';
import HistoryModal from '../components/HistoryModal';

const StatementEditorPage: React.FC = () => {
      const { projectId, statementId } = useParams<{ projectId: string; statementId: string }>();
      const navigate = useNavigate();
      const theme = useTheme();
      const { currentUserAuth, currentUserProfile } = useAuth();

      const [project, setProject] = useState<Project | null>(null);
      const [statement, setStatement] = useState<ProjectStatement | null>(null);
      const [lines, setLines] = useState<StatementLine[]>([]);
      const [loading, setLoading] = useState(true);
      const [isFirstStatement, setIsFirstStatement] = useState(false);

      // Line Modal State
      const [openLineModal, setOpenLineModal] = useState(false);
      // Allow amount to be string for better UX (clearing 0)
      const [lineFormData, setLineFormData] = useState<Partial<StatementLine> & { amount: number | string }>({
            direction: 'INCOME',
            category: '',
            description: '',
            amount: '', // Initialize as empty string
            isPaid: true
      });
      const [editingLineId, setEditingLineId] = useState<string | null>(null);

      // Close Statement Modal State
      const [openCloseModal, setOpenCloseModal] = useState(false);

      // Edit Previous Balance State
      const [openBalanceModal, setOpenBalanceModal] = useState(false);
      const [tempBalance, setTempBalance] = useState<string>('');

      // History Modal State
      const [historyModalOpen, setHistoryModalOpen] = useState(false);
      const [historyLoading, setHistoryLoading] = useState(false);
      const [historyData, setHistoryData] = useState<StatementHistoryEntry[]>([]);

      useEffect(() => {
            if (projectId && statementId) {
                  fetchData(projectId, statementId);
            }
      }, [projectId, statementId]);

      const fetchData = async (pId: string, sId: string) => {
            try {
                  const [projectData, statementData, linesData, allStatements] = await Promise.all([
                        getProjectById(pId),
                        getStatementById(sId),
                        getStatementLines(sId),
                        getStatementsByProject(pId)
                  ]);

                  setProject(projectData);
                  setStatement(statementData);
                  setLines(linesData);

                  // Check if this is the only statement (or the first one created)
                  setIsFirstStatement(allStatements.length === 1);

            } catch (error) {
                  console.error("Error fetching data:", error);
            } finally {
                  setLoading(false);
            }
      };

      const handleUpdatePreviousBalance = async (newBalance: number) => {
            if (!statementId || !statement) return;
            try {
                  // Update previousBalance and recalculate finalBalance
                  const newFinalBalance = newBalance + statement.totals.netCashReal;
                  await updateStatement(statementId, {
                        previousBalance: newBalance,
                        finalBalance: newFinalBalance
                  });
                  // Refresh data
                  const updatedStatement = await getStatementById(statementId);
                  setStatement(updatedStatement);
            } catch (error) {
                  console.error("Error updating balance:", error);
                  alert("Bakiye güncellenemedi.");
            }
      };

      const handleHistory = async () => {
            if (!statementId) return;
            setHistoryLoading(true);
            setHistoryModalOpen(true);
            try {
                  const history = await getStatementHistory(statementId);
                  setHistoryData(history);
            } catch (error) {
                  console.error("Error fetching history:", error);
                  setHistoryData([]);
            } finally {
                  setHistoryLoading(false);
            }
      };

      const handleSaveLine = async () => {
            if (!statementId || !lineFormData.description || !lineFormData.amount) return;

            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email || undefined,
                        displayName: currentUserProfile?.displayName || undefined
                  } : undefined;

                  const dataToSave = {
                        ...lineFormData,
                        amount: Number(lineFormData.amount) // Convert back to number
                  };

                  if (editingLineId) {
                        await updateStatementLine(statementId, editingLineId, dataToSave, user);
                  } else {
                        await createStatementLine(statementId, dataToSave as any, user);
                  }

                  setOpenLineModal(false);
                  setEditingLineId(null);
                  setLineFormData({ direction: 'INCOME', category: '', description: '', amount: '', isPaid: true });

                  // Refresh data to get updated totals
                  if (projectId) fetchData(projectId, statementId);

            } catch (error) {
                  console.error("Error saving line:", error);
                  alert("Satır kaydedilemedi.");
            }
      };

      const handleDeleteLine = async (lineId: string) => {
            if (!statementId || !window.confirm("Bu satırı silmek istediğinizden emin misiniz?")) return;
            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email || undefined,
                        displayName: currentUserProfile?.displayName || undefined
                  } : undefined;

                  await deleteStatementLine(statementId, lineId, user);
                  if (projectId) fetchData(projectId, statementId);
            } catch (error) {
                  console.error("Error deleting line:", error);
                  alert("Satır silinemedi.");
            }
      };

      const openAddModal = (direction: 'INCOME' | 'EXPENSE') => {
            setLineFormData({
                  direction,
                  category: direction === 'INCOME' ? 'HAKEDİŞ' : 'MALZEME',
                  description: '',
                  amount: '', // Empty string for new lines
                  isPaid: true
            });
            setEditingLineId(null);
            setOpenLineModal(true);
      };

      const openEditModal = (line: StatementLine) => {
            setLineFormData({
                  direction: line.direction,
                  category: line.category,
                  description: line.description,
                  amount: line.amount, // Existing amount (number)
                  isPaid: line.isPaid
            });
            setEditingLineId(line.id);
            setOpenLineModal(true);
      };

      const handleCloseStatement = async (action: "TRANSFERRED_TO_SAFE" | "CARRIED_OVER") => {
            if (!statementId || !projectId) return;
            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email || undefined,
                        displayName: currentUserProfile?.displayName || undefined
                  } : undefined;
                  await closeStatement(statementId, projectId, action, user);
                  setOpenCloseModal(false);
                  if (projectId) fetchData(projectId, statementId);
            } catch (error) {
                  console.error("Error closing statement:", error);
                  alert("Dönem kapatılamadı.");
            }
      };

      if (loading || !project || !statement) {
            return (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                        <CircularProgress />
                  </Box>
            );
      }

      const isClosed = statement.status === 'CLOSED';

      // Group Lines
      const incomeLines = lines.filter(l => l.direction === 'INCOME');
      const expensePaidLines = lines.filter(l => l.direction === 'EXPENSE' && l.isPaid);
      const expenseUnpaidLines = lines.filter(l => l.direction === 'EXPENSE' && !l.isPaid);

      // --- Design Tokens (Dynamic) ---
      const isDark = theme.palette.mode === 'dark';

      // Income: Teal/Cyan
      const incomeColor = {
            main: isDark ? '#4dd0e1' : '#00838f', // Cyan 300 : Cyan 800
            light: isDark ? '#006064' : '#e0f7fa', // Cyan 900 : Cyan 50
            border: isDark ? '#00acc1' : '#00acc1', // Cyan 600
            text: isDark ? '#e0f7fa' : '#006064' // Cyan 50 : Cyan 900
      };

      // Expense (Paid): Red
      const expensePaidColor = {
            main: isDark ? '#ef9a9a' : '#c62828', // Red 200 : Red 800
            light: isDark ? '#b71c1c' : '#ffebee', // Red 900 : Red 50
            border: isDark ? '#e53935' : '#e53935', // Red 600
            text: isDark ? '#ffebee' : '#b71c1c' // Red 50 : Red 900
      };

      // Expense (Unpaid): Orange/Amber
      const expenseUnpaidColor = {
            main: isDark ? '#ffcc80' : '#ef6c00', // Orange 200 : Orange 800
            light: isDark ? '#e65100' : '#fff3e0', // Orange 900 : Orange 50
            border: isDark ? '#fb8c00' : '#fb8c00', // Orange 600
            text: isDark ? '#fff3e0' : '#e65100' // Orange 50 : Orange 900
      };

      // Net Result: Indigo/Deep Purple
      const netColor = {
            main: isDark ? '#7e57c2' : '#4527a0', // Deep Purple 400 : Deep Purple 800
            light: isDark ? '#311b92' : '#ede7f6', // Deep Purple 900 : Deep Purple 50
            border: isDark ? '#5e35b1' : '#5e35b1', // Deep Purple 600
            text: isDark ? '#ede7f6' : '#311b92' // Deep Purple 50 : Deep Purple 900
      };

      return (
            <Container maxWidth="xl" sx={{ py: 4 }}>
                  {/* Top Bar */}
                  <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center">
                              <Button
                                    startIcon={<ArrowBackIcon />}
                                    onClick={() => navigate(`/projects/${projectId}`)}
                                    sx={{ mr: 2, textTransform: 'none' }}
                              >
                                    Geri
                              </Button>
                              <Box>
                                    <Typography variant="h5" fontWeight="bold">
                                          {project.name} - {statement.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                          {new Date(statement.date.toDate()).toLocaleDateString('tr-TR')} | Durum:
                                          <Box component="span" fontWeight="bold" color={isClosed ? 'success.main' : 'warning.main'} ml={0.5}>
                                                {isClosed ? 'KAPALI' : 'TASLAK'}
                                          </Box>
                                    </Typography>
                              </Box>
                        </Box>
                        <Tooltip title="Değişiklik Geçmişi">
                              <IconButton 
                                    onClick={handleHistory}
                                    sx={{ 
                                          color: 'info.main',
                                          '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                                    }}
                              >
                                    <HistoryIcon />
                              </IconButton>
                        </Tooltip>
                  </Box>

                  {/* Summary Cards */}
                  <Grid container spacing={3} mb={4}>
                        {/* INCOME CARD */}
                        <Grid size={{ xs: 12, md: 4 }}>
                              <Card elevation={2} sx={{ bgcolor: incomeColor.light, height: '100%', borderLeft: `6px solid ${incomeColor.main}` }}>
                                    <CardContent>
                                          <Typography variant="subtitle2" color={incomeColor.text} gutterBottom fontWeight="bold" sx={{ opacity: 0.8 }}>
                                                GELEN HAKEDİŞ (GELİR)
                                          </Typography>
                                          <Typography variant="h4" fontWeight="bold" color={incomeColor.main}>
                                                {statement.totals.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                          </Typography>
                                    </CardContent>
                              </Card>
                        </Grid>

                        {/* EXPENSE CARD */}
                        <Grid size={{ xs: 12, md: 4 }}>
                              <Card elevation={2} sx={{ bgcolor: expensePaidColor.light, height: '100%', borderLeft: `6px solid ${expensePaidColor.main}` }}>
                                    <CardContent>
                                          <Typography variant="subtitle2" color={expensePaidColor.text} gutterBottom fontWeight="bold" sx={{ opacity: 0.8 }}>
                                                TOPLAM HARCAMA (GİDER)
                                          </Typography>
                                          <Typography variant="h4" fontWeight="bold" color={expensePaidColor.main}>
                                                {(statement.totals.totalExpensePaid + statement.totals.totalExpenseUnpaid).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                          </Typography>
                                          <Box display="flex" gap={1} mt={1}>
                                                <Chip
                                                      label={`Ödenen: ${statement.totals.totalExpensePaid.toLocaleString('tr-TR')}`}
                                                      size="small"
                                                      sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'white', color: expensePaidColor.main, fontWeight: 'bold', border: `1px solid ${expensePaidColor.border}` }}
                                                />
                                                <Chip
                                                      label={`Bekleyen: ${statement.totals.totalExpenseUnpaid.toLocaleString('tr-TR')}`}
                                                      size="small"
                                                      sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'white', color: expenseUnpaidColor.main, fontWeight: 'bold', border: `1px solid ${expenseUnpaidColor.border}` }}
                                                />
                                          </Box>
                                    </CardContent>
                              </Card>
                        </Grid>

                        {/* NET RESULT CARD */}
                        <Grid size={{ xs: 12, md: 4 }}>
                              <Card elevation={3} sx={{ bgcolor: netColor.main, color: 'white', height: '100%' }}>
                                    <CardContent>
                                          <Typography variant="subtitle2" gutterBottom fontWeight="bold" sx={{ opacity: 0.8 }}>
                                                NET KASA (SONUÇ)
                                          </Typography>
                                          <Typography variant="h4" fontWeight="bold">
                                                {statement.finalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                          </Typography>
                                          <Box display="flex" alignItems="center" mt={1}>
                                                <Typography variant="caption" display="block" sx={{ opacity: 0.9 }}>
                                                      Devreden ({statement.previousBalance.toLocaleString('tr-TR')}) + Dönem Net ({statement.totals.netCashReal.toLocaleString('tr-TR')})
                                                </Typography>
                                                {isFirstStatement && !isClosed && (
                                                      <IconButton
                                                            size="small"
                                                            sx={{ ml: 1, color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}
                                                            onClick={() => {
                                                                  setTempBalance(statement.previousBalance.toString());
                                                                  setOpenBalanceModal(true);
                                                            }}
                                                      >
                                                            <EditIcon fontSize="small" />
                                                      </IconButton>
                                                )}
                                          </Box>
                                    </CardContent>
                              </Card>
                        </Grid>
                  </Grid>

                  {/* Main Content: Income & Expense */}
                  <Grid container spacing={4}>
                        {/* INCOME SECTION */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                              <Paper elevation={2} sx={{ p: 0, borderRadius: 2, overflow: 'hidden', borderTop: `4px solid ${incomeColor.main}` }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" p={2} bgcolor="background.paper" borderBottom={`1px solid ${incomeColor.light}`}>
                                          <Typography variant="h6" fontWeight="bold" color={incomeColor.main}>
                                                GELİR KALEMLERİ
                                          </Typography>
                                          {!isClosed && (
                                                <Button
                                                      startIcon={<AddIcon />}
                                                      variant="contained"
                                                      size="small"
                                                      onClick={() => openAddModal('INCOME')}
                                                      sx={{ bgcolor: incomeColor.main, '&:hover': { bgcolor: incomeColor.border } }}
                                                >
                                                      Gelir Ekle
                                                </Button>
                                          )}
                                    </Box>
                                    <TableContainer sx={{ p: 0 }}>
                                          <Table size="small">
                                                <TableHead>
                                                      <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa' }}>
                                                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Açıklama</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Kategori</TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Tutar</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Durum</TableCell>
                                                            {!isClosed && <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>İşlem</TableCell>}
                                                      </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                      {incomeLines.map((line) => (
                                                            <TableRow key={line.id} hover>
                                                                  <TableCell>{line.description}</TableCell>
                                                                  <TableCell>
                                                                        <Chip label={line.category} size="small" variant="outlined" sx={{ borderColor: incomeColor.border, color: incomeColor.text, fontSize: '0.75rem' }} />
                                                                  </TableCell>
                                                                  <TableCell align="right" sx={{ fontWeight: 'bold', color: incomeColor.main, fontSize: '1rem' }}>
                                                                        {line.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                                  </TableCell>
                                                                  <TableCell>
                                                                        <Chip
                                                                              label={line.isPaid ? "Gerçekleşti" : "Tahmini"}
                                                                              size="small"
                                                                              sx={{ bgcolor: line.isPaid ? incomeColor.light : 'default', color: line.isPaid ? incomeColor.text : 'default' }}
                                                                        />
                                                                  </TableCell>
                                                                  {!isClosed && (
                                                                        <TableCell align="right">
                                                                              <IconButton size="small" onClick={() => openEditModal(line)}><EditIcon fontSize="small" /></IconButton>
                                                                              <IconButton size="small" color="error" onClick={() => handleDeleteLine(line.id)}><DeleteIcon fontSize="small" /></IconButton>
                                                                        </TableCell>
                                                                  )}
                                                            </TableRow>
                                                      ))}
                                                      {incomeLines.length === 0 && (
                                                            <TableRow>
                                                                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>Henüz gelir kaydı yok</TableCell>
                                                            </TableRow>
                                                      )}
                                                </TableBody>
                                          </Table>
                                    </TableContainer>
                              </Paper>
                        </Grid>

                        {/* EXPENSE SECTION */}
                        <Grid size={{ xs: 12, lg: 6 }}>
                              <Paper elevation={2} sx={{ p: 0, borderRadius: 2, overflow: 'hidden', borderTop: `4px solid ${expensePaidColor.main}` }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" p={2} bgcolor="background.paper" borderBottom={`1px solid ${expensePaidColor.light}`}>
                                          <Typography variant="h6" fontWeight="bold" color={expensePaidColor.main}>
                                                GİDER KALEMLERİ
                                          </Typography>
                                          {!isClosed && (
                                                <Button
                                                      startIcon={<AddIcon />}
                                                      variant="contained"
                                                      size="small"
                                                      onClick={() => openAddModal('EXPENSE')}
                                                      sx={{ bgcolor: expensePaidColor.main, '&:hover': { bgcolor: expensePaidColor.border } }}
                                                >
                                                      Gider Ekle
                                                </Button>
                                          )}
                                    </Box>

                                    <Box>
                                          {/* Paid Expenses */}
                                          <Box px={2} py={1} bgcolor={expensePaidColor.light} borderBottom={`1px solid ${expensePaidColor.light}`}>
                                                <Typography variant="subtitle2" fontWeight="bold" color={expensePaidColor.text}>
                                                      ÖDENEN GİDERLER
                                                </Typography>
                                          </Box>
                                          <TableContainer>
                                                <Table size="small">
                                                      <TableHead>
                                                            <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa' }}>
                                                                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Açıklama</TableCell>
                                                                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Kategori</TableCell>
                                                                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Tutar</TableCell>
                                                                  {!isClosed && <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>İşlem</TableCell>}
                                                            </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                            {expensePaidLines.map((line) => (
                                                                  <TableRow key={line.id} hover>
                                                                        <TableCell>{line.description}</TableCell>
                                                                        <TableCell>
                                                                              <Chip label={line.category} size="small" variant="outlined" sx={{ borderColor: expensePaidColor.border, color: expensePaidColor.text, fontSize: '0.75rem' }} />
                                                                        </TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: expensePaidColor.main, fontSize: '1rem' }}>
                                                                              {line.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                                        </TableCell>
                                                                        {!isClosed && (
                                                                              <TableCell align="right">
                                                                                    <IconButton size="small" onClick={() => openEditModal(line)}><EditIcon fontSize="small" /></IconButton>
                                                                                    <IconButton size="small" color="error" onClick={() => handleDeleteLine(line.id)}><DeleteIcon fontSize="small" /></IconButton>
                                                                              </TableCell>
                                                                        )}
                                                                  </TableRow>
                                                            ))}
                                                            {expensePaidLines.length === 0 && (
                                                                  <TableRow>
                                                                        <TableCell colSpan={4} align="center" sx={{ py: 2, color: 'text.secondary', fontStyle: 'italic' }}>Ödenen gider yok</TableCell>
                                                                  </TableRow>
                                                            )}
                                                      </TableBody>
                                                </Table>
                                          </TableContainer>

                                          {/* Unpaid Expenses */}
                                          <Box px={2} py={1} bgcolor={expenseUnpaidColor.light} borderTop={`1px solid ${expenseUnpaidColor.light}`} borderBottom={`1px solid ${expenseUnpaidColor.light}`}>
                                                <Typography variant="subtitle2" fontWeight="bold" color={expenseUnpaidColor.text}>
                                                      ÖDENMEYEN / REVİZE GİDERLER
                                                </Typography>
                                          </Box>
                                          <TableContainer>
                                                <Table size="small">
                                                      <TableHead>
                                                            <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fafafa' }}>
                                                                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Açıklama</TableCell>
                                                                  <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Kategori</TableCell>
                                                                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Tutar</TableCell>
                                                                  {!isClosed && <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>İşlem</TableCell>}
                                                            </TableRow>
                                                      </TableHead>
                                                      <TableBody>
                                                            {expenseUnpaidLines.map((line) => (
                                                                  <TableRow key={line.id} hover>
                                                                        <TableCell>{line.description}</TableCell>
                                                                        <TableCell>
                                                                              <Chip label={line.category} size="small" variant="outlined" sx={{ borderColor: expenseUnpaidColor.border, color: expenseUnpaidColor.text, fontSize: '0.75rem' }} />
                                                                        </TableCell>
                                                                        <TableCell align="right" sx={{ fontWeight: 'bold', color: expenseUnpaidColor.main, fontSize: '1rem' }}>
                                                                              {line.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                                        </TableCell>
                                                                        {!isClosed && (
                                                                              <TableCell align="right">
                                                                                    <IconButton size="small" onClick={() => openEditModal(line)}><EditIcon fontSize="small" /></IconButton>
                                                                                    <IconButton size="small" color="error" onClick={() => handleDeleteLine(line.id)}><DeleteIcon fontSize="small" /></IconButton>
                                                                              </TableCell>
                                                                        )}
                                                                  </TableRow>
                                                            ))}
                                                            {expenseUnpaidLines.length === 0 && (
                                                                  <TableRow>
                                                                        <TableCell colSpan={4} align="center" sx={{ py: 2, color: 'text.secondary', fontStyle: 'italic' }}>Bekleyen gider yok</TableCell>
                                                                  </TableRow>
                                                            )}
                                                      </TableBody>
                                                </Table>
                                          </TableContainer>
                                    </Box>
                              </Paper>
                        </Grid>
                  </Grid>

                  {/* Footer Actions */}
                  <Box mt={4} display="flex" justifyContent="center">
                        {!isClosed ? (
                              <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<LockIcon />}
                                    onClick={() => setOpenCloseModal(true)}
                                    sx={{ px: 5, py: 1.5, borderRadius: 3, fontSize: '1.1rem', bgcolor: netColor.main, '&:hover': { bgcolor: netColor.border } }}
                              >
                                    DÖNEMİ KAPAT
                              </Button>
                        ) : (
                              <Alert severity="info" icon={<LockIcon />} sx={{ width: '100%', justifyContent: 'center' }}>
                                    <Typography variant="h6">
                                          Bu dönem kapatılmıştır.
                                          {statement.transferAction === 'CARRIED_OVER' && " Bakiye sonraki hakedişe devredildi."}
                                          {statement.transferAction === 'TRANSFERRED_TO_SAFE' && " Bakiye şirket kasasına aktarıldı."}
                                    </Typography>
                              </Alert>
                        )}
                  </Box>

                  {/* Line Form Modal */}
                  <Dialog open={openLineModal} onClose={() => setOpenLineModal(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>
                              {editingLineId ? 'Satırı Düzenle' : (lineFormData.direction === 'INCOME' ? 'Yeni Gelir Ekle' : 'Yeni Gider Ekle')}
                        </DialogTitle>
                        <DialogContent>
                              <Box component="form" sx={{ mt: 1 }}>
                                    <TextField
                                          fullWidth
                                          label="Açıklama"
                                          value={lineFormData.description}
                                          onChange={(e) => setLineFormData({ ...lineFormData, description: e.target.value })}
                                          margin="normal"
                                          required
                                    />
                                    <TextField
                                          fullWidth
                                          label="Tutar"
                                          type="number"
                                          value={lineFormData.amount}
                                          onChange={(e) => setLineFormData({ ...lineFormData, amount: e.target.value })}
                                          onFocus={(e) => e.target.select()}
                                          margin="normal"
                                          required
                                    />
                                    <FormControl fullWidth margin="normal">
                                          <InputLabel>Kategori</InputLabel>
                                          <Select
                                                value={lineFormData.category}
                                                label="Kategori"
                                                onChange={(e) => setLineFormData({ ...lineFormData, category: e.target.value })}
                                          >
                                                {lineFormData.direction === 'INCOME' ? (
                                                      [
                                                            <MenuItem key="hak" value="HAKEDİŞ">Hakediş</MenuItem>,
                                                            <MenuItem key="ek" value="EK_İŞ">Ek İş</MenuItem>,
                                                            <MenuItem key="diger" value="DİĞER">Diğer</MenuItem>
                                                      ]
                                                ) : (
                                                      [
                                                            <MenuItem key="mal" value="MALZEME">Malzeme</MenuItem>,
                                                            <MenuItem key="isc" value="İŞÇİLİK">İşçilik</MenuItem>,
                                                            <MenuItem key="tas" value="TAŞERON">Taşeron</MenuItem>,
                                                            <MenuItem key="ver" value="VERGİ">Vergi</MenuItem>,
                                                            <MenuItem key="gen" value="GENEL_GİDER">Genel Gider</MenuItem>
                                                      ]
                                                )}
                                          </Select>
                                    </FormControl>
                                    <FormControl fullWidth margin="normal">
                                          <InputLabel>Durum</InputLabel>
                                          <Select
                                                value={lineFormData.isPaid ? "true" : "false"}
                                                label="Durum"
                                                onChange={(e) => setLineFormData({ ...lineFormData, isPaid: e.target.value === "true" })}
                                          >
                                                <MenuItem value="true">{lineFormData.direction === 'INCOME' ? 'Gerçekleşti' : 'ÖDENDİ'}</MenuItem>
                                                <MenuItem value="false">{lineFormData.direction === 'INCOME' ? 'Tahmini' : 'ÖDENMEDİ / REVİZE'}</MenuItem>
                                          </Select>
                                    </FormControl>
                              </Box>
                        </DialogContent>
                        <DialogActions>
                              <Button onClick={() => setOpenLineModal(false)}>İptal</Button>
                              <Button onClick={handleSaveLine} variant="contained" disabled={!lineFormData.description || !lineFormData.amount}>
                                    Kaydet
                              </Button>
                        </DialogActions>
                  </Dialog>

                  {/* Close Statement Dialog */}
                  <Dialog open={openCloseModal} onClose={() => setOpenCloseModal(false)}>
                        <DialogTitle>Dönemi Kapat</DialogTitle>
                        <DialogContent>
                              <Typography>
                                    Bu hakediş sonucunu ne yapmak istersiniz? Bu işlem geri alınamaz.
                              </Typography>
                        </DialogContent>
                        <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 3 }}>
                              <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleCloseStatement('CARRIED_OVER')}
                              >
                                    Sonraki Hakedişe Devret
                              </Button>
                              <Button
                                    fullWidth
                                    variant="outlined"
                                    color="info"
                                    onClick={() => handleCloseStatement('TRANSFERRED_TO_SAFE')}
                              >
                                    Şirket Kasasına Aktar
                              </Button>
                              <Button fullWidth color="inherit" onClick={() => setOpenCloseModal(false)}>
                                    İptal
                              </Button>
                        </DialogActions>
                  </Dialog>

                  {/* Edit Previous Balance Dialog */}
                  <Dialog open={openBalanceModal} onClose={() => setOpenBalanceModal(false)} maxWidth="xs" fullWidth>
                        <DialogTitle>Devreden Bakiyeyi Düzenle</DialogTitle>
                        <DialogContent>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Bu ilk hakediş olduğu için başlangıç bakiyesini manuel olarak belirleyebilirsiniz.
                              </Typography>
                              <TextField
                                    autoFocus
                                    margin="dense"
                                    label="Devreden Bakiye"
                                    type="number"
                                    fullWidth
                                    value={tempBalance}
                                    onChange={(e) => setTempBalance(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                              />
                        </DialogContent>
                        <DialogActions>
                              <Button onClick={() => setOpenBalanceModal(false)}>İptal</Button>
                              <Button
                                    onClick={() => {
                                          handleUpdatePreviousBalance(Number(tempBalance));
                                          setOpenBalanceModal(false);
                                    }}
                                    variant="contained"
                              >
                                    Güncelle
                              </Button>
                        </DialogActions>
                  </Dialog>

                  {/* History Modal */}
                  <HistoryModal
                        open={historyModalOpen}
                        onClose={() => setHistoryModalOpen(false)}
                        title={`${statement?.title || 'Hakediş'} - Değişiklik Geçmişi`}
                        history={historyData}
                        loading={historyLoading}
                  />
            </Container>
      );
};

export default StatementEditorPage;
