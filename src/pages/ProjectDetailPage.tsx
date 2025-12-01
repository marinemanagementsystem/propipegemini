import React, { useEffect, useState } from 'react';
import {
      Container,
      Typography,
      Button,
      Grid,
      Card,
      CardContent,
      Chip,
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
      Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, getStatementsByProject, createStatement, deleteStatement } from '../services/projects';
import type { Project, ProjectStatement } from '../types/Project';
import { useAuth } from '../context/AuthContext';

const ProjectDetailPage: React.FC = () => {
      const { projectId } = useParams<{ projectId: string }>();
      const navigate = useNavigate();
      const { currentUserAuth, currentUserProfile } = useAuth();

      const [project, setProject] = useState<Project | null>(null);
      const [statements, setStatements] = useState<ProjectStatement[]>([]);
      const [loading, setLoading] = useState(true);

      // Modal State
      const [openModal, setOpenModal] = useState(false);
      const [formData, setFormData] = useState({ title: '', date: new Date().toISOString().split('T')[0] });
      const [submitting, setSubmitting] = useState(false);

      useEffect(() => {
            if (projectId) {
                  fetchData(projectId);
            }
      }, [projectId]);

      const fetchData = async (id: string) => {
            try {
                  const [projectData, statementsData] = await Promise.all([
                        getProjectById(id),
                        getStatementsByProject(id)
                  ]);
                  setProject(projectData);
                  setStatements(statementsData);
            } catch (error) {
                  console.error("Error fetching data:", error);
            } finally {
                  setLoading(false);
            }
      };

      const handleCreateStatement = async () => {
            if (!projectId || !project || !formData.title || !formData.date) return;

            setSubmitting(true);
            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email || undefined,
                        displayName: currentUserProfile?.displayName || undefined
                  } : undefined;

                  // First statement rule: If no statements exist, user might want to set opening balance manually.
                  // But for simplicity in this modal, we just take currentBalance. 
                  // The user can edit previousBalance inside the StatementEditor if it's the first statement.
                  const previousBalance = project.currentBalance;

                  const newId = await createStatement(
                        projectId,
                        {
                              title: formData.title,
                              date: new Date(formData.date),
                              previousBalance
                        },
                        user
                  );

                  setOpenModal(false);
                  setFormData({ title: '', date: new Date().toISOString().split('T')[0] });
                  // Navigate to the new statement editor immediately
                  navigate(`/projects/${projectId}/statements/${newId}`);
            } catch (error) {
                  console.error("Error creating statement:", error);
                  alert("Hakediş dosyası oluşturulurken bir hata oluştu.");
                  setSubmitting(false);
            }
      };

      const handleDeleteStatement = async (statementId: string) => {
            if (!window.confirm("Bu taslak hakediş dosyasını silmek istediğinizden emin misiniz?")) return;

            try {
                  await deleteStatement(statementId);
                  if (projectId) fetchData(projectId);
            } catch (error) {
                  console.error("Error deleting statement:", error);
                  alert("Silme işlemi başarısız oldu.");
            }
      };

      const formatDate = (timestamp: any) => {
            if (!timestamp) return '-';
            const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return d.toLocaleDateString('tr-TR');
      };

      if (loading) {
            return (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                        <CircularProgress />
                  </Box>
            );
      }

      if (!project) {
            return (
                  <Container sx={{ py: 4 }}>
                        <Alert severity="error">Tersane bulunamadı.</Alert>
                        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/projects')} sx={{ mt: 2 }}>
                              Geri Dön
                        </Button>
                  </Container>
            );
      }

      return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                  {/* Header */}
                  <Box mb={4}>
                        <Button
                              startIcon={<ArrowBackIcon />}
                              onClick={() => navigate('/projects')}
                              sx={{ mb: 2, textTransform: 'none' }}
                        >
                              Tersaneler Listesine Dön
                        </Button>

                        <Grid container spacing={3} alignItems="center">
                              <Grid size={{ xs: 12, md: 8 }}>
                                    <Typography variant="h4" component="h1" fontWeight="bold">
                                          {project.name}
                                    </Typography>
                                    <Typography variant="subtitle1" color="text.secondary">
                                          📍 {project.location}
                                    </Typography>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                    <Card elevation={3} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                                      ANLIK İÇ BAKİYE
                                                </Typography>
                                                <Typography variant="h4" fontWeight="bold">
                                                      {project.currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                </Typography>
                                          </CardContent>
                                    </Card>
                              </Grid>
                        </Grid>
                  </Box>

                  {/* Statements List */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h5" fontWeight="bold">
                              Hakediş Dosyaları
                        </Typography>
                        <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={() => setOpenModal(true)}
                              sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                              Yeni Hakediş Dosyası Ekle
                        </Button>
                  </Box>

                  {statements.length === 0 ? (
                        <Alert severity="info">Bu tersane için henüz hakediş dosyası oluşturulmamış.</Alert>
                  ) : (
                        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                              <Table>
                                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                          <TableRow>
                                                <TableCell><strong>Tarih</strong></TableCell>
                                                <TableCell><strong>Başlık</strong></TableCell>
                                                <TableCell><strong>Durum</strong></TableCell>
                                                <TableCell align="right"><strong>Devreden</strong></TableCell>
                                                <TableCell align="right"><strong>Dönem İçi Net</strong></TableCell>
                                                <TableCell align="right"><strong>Toplam Sonuç</strong></TableCell>
                                                <TableCell><strong>Transfer İşlemi</strong></TableCell>
                                                <TableCell align="right"><strong>İşlemler</strong></TableCell>
                                          </TableRow>
                                    </TableHead>
                                    <TableBody>
                                          {statements.map((statement) => (
                                                <TableRow key={statement.id} hover>
                                                      <TableCell>{formatDate(statement.date)}</TableCell>
                                                      <TableCell>{statement.title}</TableCell>
                                                      <TableCell>
                                                            <Chip
                                                                  label={statement.status === 'DRAFT' ? 'Taslak' : 'Kapalı'}
                                                                  color={statement.status === 'DRAFT' ? 'warning' : 'success'}
                                                                  size="small"
                                                                  variant={statement.status === 'DRAFT' ? 'outlined' : 'filled'}
                                                            />
                                                      </TableCell>
                                                      <TableCell align="right">
                                                            {statement.previousBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                      </TableCell>
                                                      <TableCell align="right" sx={{ color: statement.totals.netCashReal >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                                                            {statement.totals.netCashReal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                      </TableCell>
                                                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                            {statement.finalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                      </TableCell>
                                                      <TableCell>
                                                            {statement.transferAction === 'NONE' && '-'}
                                                            {statement.transferAction === 'CARRIED_OVER' && <Chip label="Devredildi" size="small" />}
                                                            {statement.transferAction === 'TRANSFERRED_TO_SAFE' && <Chip label="Kasaya Aktarıldı" size="small" color="info" />}
                                                      </TableCell>
                                                      <TableCell align="right">
                                                            <Box display="flex" justifyContent="flex-end">
                                                                  <Button
                                                                        size="small"
                                                                        startIcon={<EditIcon />}
                                                                        onClick={() => navigate(`/projects/${projectId}/statements/${statement.id}`)}
                                                                        sx={{ mr: 1, textTransform: 'none' }}
                                                                  >
                                                                        Detay
                                                                  </Button>
                                                                  {statement.status === 'DRAFT' && (
                                                                        <IconButton
                                                                              size="small"
                                                                              color="error"
                                                                              onClick={() => handleDeleteStatement(statement.id)}
                                                                        >
                                                                              <DeleteIcon />
                                                                        </IconButton>
                                                                  )}
                                                            </Box>
                                                      </TableCell>
                                                </TableRow>
                                          ))}
                                    </TableBody>
                              </Table>
                        </TableContainer>
                  )}

                  {/* Create Statement Modal */}
                  <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>Yeni Hakediş Dosyası Ekle</DialogTitle>
                        <DialogContent>
                              <Box component="form" sx={{ mt: 1 }}>
                                    <TextField
                                          fullWidth
                                          label="Başlık (Örn: Temmuz 1. Ara Hakediş)"
                                          value={formData.title}
                                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                          margin="normal"
                                          required
                                    />
                                    <TextField
                                          fullWidth
                                          label="Tarih"
                                          type="date"
                                          value={formData.date}
                                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                          margin="normal"
                                          InputLabelProps={{ shrink: true }}
                                          required
                                    />
                              </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 3 }}>
                              <Button onClick={() => setOpenModal(false)} color="inherit">
                                    İptal
                              </Button>
                              <Button
                                    onClick={handleCreateStatement}
                                    variant="contained"
                                    disabled={submitting || !formData.title || !formData.date}
                              >
                                    {submitting ? <CircularProgress size={24} /> : 'Oluştur ve Düzenle'}
                              </Button>
                        </DialogActions>
                  </Dialog>
            </Container>
      );
};

export default ProjectDetailPage;
