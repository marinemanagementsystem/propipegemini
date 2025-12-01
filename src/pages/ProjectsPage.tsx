import React, { useEffect, useState } from 'react';
import {
      Container,
      Typography,
      Button,
      Grid,
      Card,
      CardContent,
      CardActions,
      Dialog,
      DialogTitle,
      DialogContent,
      DialogActions,
      TextField,
      CircularProgress,
      Box,
      Alert,
      alpha,
      Chip,
      Paper,
      InputAdornment,
      IconButton,
      Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AnchorIcon from '@mui/icons-material/Anchor';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, getProjectHistory } from '../services/projects';
import type { Project, ProjectHistoryEntry } from '../types/Project';
import { useAuth } from '../context/AuthContext';
import HistoryModal from '../components/HistoryModal';

const ProjectsPage: React.FC = () => {
      const navigate = useNavigate();
      const theme = useTheme();
      const { currentUserAuth, currentUserProfile } = useAuth();
      const [projects, setProjects] = useState<Project[]>([]);
      const [loading, setLoading] = useState(true);
      const [openModal, setOpenModal] = useState(false);
      const [formData, setFormData] = useState({ name: '', location: '' });
      const [submitting, setSubmitting] = useState(false);
      const [searchQuery, setSearchQuery] = useState('');

      // History Modal State
      const [historyModalOpen, setHistoryModalOpen] = useState(false);
      const [historyLoading, setHistoryLoading] = useState(false);
      const [historyData, setHistoryData] = useState<ProjectHistoryEntry[]>([]);
      const [selectedProjectName, setSelectedProjectName] = useState<string>('');

      const isDark = theme.palette.mode === 'dark';

      useEffect(() => {
            fetchProjects();
      }, []);

      const fetchProjects = async () => {
            try {
                  const data = await getProjects();
                  setProjects(data);
            } catch (error) {
                  console.error("Error fetching projects:", error);
            } finally {
                  setLoading(false);
            }
      };

      const handleCreateProject = async () => {
            if (!formData.name || !formData.location) return;

            setSubmitting(true);
            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email || undefined,
                        displayName: currentUserProfile?.displayName || undefined
                  } : undefined;

                  await createProject(formData, user);
                  setOpenModal(false);
                  setFormData({ name: '', location: '' });
                  fetchProjects();
            } catch (error) {
                  console.error("Error creating project:", error);
                  alert("Tersane oluşturulurken bir hata oluştu.");
            } finally {
                  setSubmitting(false);
            }
      };

      const handleHistory = async (project: Project) => {
            setSelectedProjectName(project.name);
            setHistoryLoading(true);
            setHistoryModalOpen(true);
            try {
                  const history = await getProjectHistory(project.id);
                  setHistoryData(history);
            } catch (error) {
                  console.error("Error fetching history:", error);
                  setHistoryData([]);
            } finally {
                  setHistoryLoading(false);
            }
      };

      // Filter projects by search
      const filteredProjects = projects.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Calculate stats
      const totalBalance = projects.reduce((sum, p) => sum + (p.currentBalance || 0), 0);
      const positiveBalanceCount = projects.filter(p => (p.currentBalance || 0) > 0).length;

      if (loading) {
            return (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                        <CircularProgress />
                  </Box>
            );
      }

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
                        <Container maxWidth="lg">
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
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
                                                Tersaneler
                                          </Typography>
                                          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500 }}>
                                                Tüm tersane projelerinizi yönetin, hakediş dosyalarını takip edin
                                          </Typography>
                                    </Box>
                                    <Button
                                          variant="contained"
                                          size="large"
                                          startIcon={<AddIcon />}
                                          onClick={() => setOpenModal(true)}
                                          sx={{ 
                                                px: 4, 
                                                py: 1.5,
                                                fontSize: '1rem',
                                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                          }}
                                    >
                                          Yeni Tersane Ekle
                                    </Button>
                              </Box>

                              {/* Stats Cards */}
                              <Grid container spacing={3} sx={{ mt: 3 }}>
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
                                                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                            }}
                                                      >
                                                            <AnchorIcon sx={{ color: 'white', fontSize: 24 }} />
                                                      </Box>
                                                      <Box>
                                                            <Typography variant="h4" fontWeight={700}>
                                                                  {projects.length}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                  Toplam Tersane
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
                                                            <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 24 }} />
                                                      </Box>
                                                      <Box>
                                                            <Typography variant="h5" fontWeight={700} sx={{ fontSize: '1.3rem' }}>
                                                                  {totalBalance.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                  Toplam Bakiye
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
                                                            <TrendingUpIcon sx={{ color: 'white', fontSize: 24 }} />
                                                      </Box>
                                                      <Box>
                                                            <Typography variant="h4" fontWeight={700}>
                                                                  {positiveBalanceCount}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                  Pozitif Bakiye
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
                                                <TextField
                                                      fullWidth
                                                      placeholder="Tersane ara..."
                                                      size="small"
                                                      value={searchQuery}
                                                      onChange={(e) => setSearchQuery(e.target.value)}
                                                      InputProps={{
                                                            startAdornment: (
                                                                  <InputAdornment position="start">
                                                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                                                  </InputAdornment>
                                                            ),
                                                      }}
                                                      sx={{ 
                                                            '& .MuiOutlinedInput-root': { 
                                                                  bgcolor: 'transparent',
                                                                  '& fieldset': { borderColor: alpha(theme.palette.divider, 0.2) },
                                                            }
                                                      }}
                                                />
                                          </Paper>
                                    </Grid>
                              </Grid>
                        </Container>
                  </Box>

                  {/* Projects Grid */}
                  <Container maxWidth="lg" sx={{ mt: -2 }}>
                        {filteredProjects.length === 0 ? (
                              <Alert 
                                    severity="info" 
                                    sx={{ 
                                          mt: 4, 
                                          borderRadius: 3,
                                          bgcolor: alpha(theme.palette.info.main, 0.1),
                                    }}
                              >
                                    {searchQuery 
                                          ? `"${searchQuery}" için sonuç bulunamadı.`
                                          : 'Henüz kayıtlı bir tersane bulunmamaktadır.'
                                    }
                              </Alert>
                        ) : (
                              <Grid container spacing={3} sx={{ pt: 4 }}>
                                    {filteredProjects.map((project) => (
                                          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
                                                <Card
                                                      sx={{
                                                            height: '100%',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                            overflow: 'visible',
                                                            '&::before': {
                                                                  content: '""',
                                                                  position: 'absolute',
                                                                  top: 0,
                                                                  left: 0,
                                                                  right: 0,
                                                                  height: 4,
                                                                  borderRadius: '20px 20px 0 0',
                                                                  background: (project.currentBalance || 0) >= 0
                                                                        ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                                                                        : `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
                                                            },
                                                      }}
                                                      onClick={() => navigate(`/projects/${project.id}`)}
                                                >
                                                      <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                                                            <Box display="flex" alignItems="flex-start" gap={2} mb={2.5}>
                                                                  <Box 
                                                                        sx={{ 
                                                                              width: 52, 
                                                                              height: 52, 
                                                                              borderRadius: 3,
                                                                              display: 'flex',
                                                                              alignItems: 'center',
                                                                              justifyContent: 'center',
                                                                              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
                                                                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                                                        }}
                                                                  >
                                                                        <BusinessIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                                                                  </Box>
                                                                  <Box flex={1}>
                                                                        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
                                                                              {project.name}
                                                                        </Typography>
                                                                        <Box display="flex" alignItems="center" color="text.secondary">
                                                                              <LocationOnIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                                              <Typography variant="body2">
                                                                                    {project.location}
                                                                              </Typography>
                                                                        </Box>
                                                                  </Box>
                                                            </Box>

                                                            <Box
                                                                  sx={{
                                                                        p: 2.5,
                                                                        borderRadius: 3,
                                                                        background: isDark 
                                                                              ? alpha(theme.palette.background.default, 0.5)
                                                                              : alpha(theme.palette.grey[100], 0.8),
                                                                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                                                  }}
                                                            >
                                                                  <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={1}>
                                                                        ANLIK İÇ BAKİYE
                                                                  </Typography>
                                                                  <Typography 
                                                                        variant="h4" 
                                                                        fontWeight={800}
                                                                        sx={{ 
                                                                              mt: 0.5,
                                                                              color: (project.currentBalance || 0) >= 0 ? 'success.main' : 'error.main',
                                                                        }}
                                                                  >
                                                                        {(project.currentBalance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} 
                                                                        <Typography component="span" variant="h6" sx={{ ml: 0.5 }}>₺</Typography>
                                                                  </Typography>
                                                            </Box>
                                                      </CardContent>
                                                      <CardActions sx={{ p: 2.5, pt: 0 }}>
                                                            <Tooltip title="Geçmiş">
                                                                  <IconButton
                                                                        size="small"
                                                                        onClick={(e) => { e.stopPropagation(); handleHistory(project); }}
                                                                        sx={{ 
                                                                              color: 'info.main',
                                                                              mr: 1,
                                                                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                                                                        }}
                                                                  >
                                                                        <HistoryIcon fontSize="small" />
                                                                  </IconButton>
                                                            </Tooltip>
                                                            <Button
                                                                  fullWidth
                                                                  variant="outlined"
                                                                  endIcon={<ArrowForwardIcon />}
                                                                  sx={{ 
                                                                        py: 1.2,
                                                                        borderWidth: 1.5,
                                                                        '&:hover': { borderWidth: 1.5 },
                                                                  }}
                                                            >
                                                                  Detayları Görüntüle
                                                            </Button>
                                                      </CardActions>
                                                </Card>
                                          </Grid>
                                    ))}
                              </Grid>
                        )}
                  </Container>
                  
                  {/* Create Project Modal */}
                  <Dialog 
                        open={openModal} 
                        onClose={() => setOpenModal(false)} 
                        maxWidth="sm" 
                        fullWidth
                        PaperProps={{
                              sx: { borderRadius: 4 }
                        }}
                  >
                        <DialogTitle sx={{ pb: 1 }}>
                              <Typography variant="h5" fontWeight={700}>Yeni Tersane Ekle</Typography>
                              <Typography variant="body2" color="text.secondary">
                                    Yeni bir tersane projesi oluşturun
                              </Typography>
                        </DialogTitle>
                        <DialogContent>
                              <Box component="form" sx={{ mt: 2 }}>
                                    <TextField
                                          fullWidth
                                          label="Tersane Adı"
                                          placeholder="Örn: Sedef Tersanesi"
                                          value={formData.name}
                                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                          margin="normal"
                                          required
                                    />
                                    <TextField
                                          fullWidth
                                          label="Lokasyon"
                                          placeholder="Örn: Tuzla, İstanbul"
                                          value={formData.location}
                                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                          margin="normal"
                                          required
                                    />
                              </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 3, pt: 2 }}>
                              <Button onClick={() => setOpenModal(false)} color="inherit" sx={{ px: 3 }}>
                                    İptal
                              </Button>
                              <Button
                                    onClick={handleCreateProject}
                                    variant="contained"
                                    disabled={submitting || !formData.name || !formData.location}
                                    sx={{ px: 4 }}
                              >
                                    {submitting ? <CircularProgress size={24} /> : 'Tersane Oluştur'}
                              </Button>
                        </DialogActions>
                  </Dialog>

                  {/* History Modal */}
                  <HistoryModal
                        open={historyModalOpen}
                        onClose={() => setHistoryModalOpen(false)}
                        title={`${selectedProjectName} - Değişiklik Geçmişi`}
                        history={historyData}
                        loading={historyLoading}
                  />
            </Box>
      );
};

export default ProjectsPage;
