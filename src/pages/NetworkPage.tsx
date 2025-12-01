import React, { useEffect, useState } from 'react';
import {
      Container,
      Typography,
      Button,
      Grid,
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
      Stack,
      Tabs,
      Tab,
      alpha,
      InputAdornment,
      Tooltip,
      Dialog,
      DialogTitle,
      DialogContent,
      DialogActions,
      CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreIcon from '@mui/icons-material/Restore';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import BuildIcon from '@mui/icons-material/Build';
import SailingIcon from '@mui/icons-material/Sailing';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';

import {
      getNetworkContacts,
      createNetworkContact,
      updateNetworkContact,
      deleteNetworkContact,
      restoreNetworkContact,
      hardDeleteNetworkContact,
      getNetworkHistory,
} from '../services/network';
import type {
      NetworkContact,
      NetworkContactFormData,
      NetworkCategory,
      ContactStatus,
      QuoteStatus,
      ResultStatus,
      ServiceArea,
      NetworkHistoryEntry,
} from '../types/Network';
import {
      getCategoryLabel,
      getContactStatusLabel,
      getQuoteStatusLabel,
      getResultStatusLabel,
      getServiceAreaLabel,
} from '../types/Network';
import { useAuth } from '../context/AuthContext';
import { networkSeedData } from '../utils/networkSeedData';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HistoryModal from '../components/HistoryModal';

const NetworkPage: React.FC = () => {
      const [contacts, setContacts] = useState<NetworkContact[]>([]);
      const [loading, setLoading] = useState(true);
      const theme = useTheme();
      const isDark = theme.palette.mode === 'dark';

      // Auth
      const { currentUserAuth, currentUserProfile } = useAuth();

      // Filters
      const [searchQuery, setSearchQuery] = useState('');
      const [filterCategory, setFilterCategory] = useState<string>('ALL');
      const [filterContactStatus, setFilterContactStatus] = useState<string>('ALL');
      const [filterQuoteStatus, setFilterQuoteStatus] = useState<string>('ALL');

      // Tabs
      const [tabValue, setTabValue] = useState(0); // 0: Active, 1: Deleted

      // Modal State
      const [modalOpen, setModalOpen] = useState(false);
      const [editingContact, setEditingContact] = useState<NetworkContact | null>(null);
      const [submitting, setSubmitting] = useState(false);

      // History Modal State
      const [historyModalOpen, setHistoryModalOpen] = useState(false);
      const [historyLoading, setHistoryLoading] = useState(false);
      const [historyData, setHistoryData] = useState<NetworkHistoryEntry[]>([]);
      const [selectedContactName, setSelectedContactName] = useState<string>('');

      // Form State
      const [formData, setFormData] = useState<NetworkContactFormData>({
            companyName: '',
            contactPerson: '',
            phone: '',
            email: '',
            category: 'YENI_INSA',
            serviceArea: undefined,
            shipType: '',
            contactStatus: 'BEKLEMEDE',
            quoteStatus: 'HAYIR',
            quoteDate: undefined,
            result: undefined,
            notes: '',
      });

      const fetchData = async () => {
            setLoading(true);
            try {
                  const showDeleted = tabValue === 1;
                  const data = await getNetworkContacts(showDeleted);
                  setContacts(data);
            } catch (error) {
                  console.error("Error fetching contacts:", error);
            } finally {
                  setLoading(false);
            }
      };

      useEffect(() => {
            fetchData();
      }, [tabValue]);

      // Filter contacts
      const filteredContacts = contacts.filter(contact => {
            const matchesSearch = 
                  contact.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  contact.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (contact.phone || '').includes(searchQuery) ||
                  (contact.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesCategory = filterCategory === 'ALL' || contact.category === filterCategory;
            const matchesContactStatus = filterContactStatus === 'ALL' || contact.contactStatus === filterContactStatus;
            const matchesQuoteStatus = filterQuoteStatus === 'ALL' || contact.quoteStatus === filterQuoteStatus;

            return matchesSearch && matchesCategory && matchesContactStatus && matchesQuoteStatus;
      });

      // Stats
      const totalContacts = contacts.length;
      const contactedCount = contacts.filter(c => c.contactStatus === 'ULASILDI').length;
      const quoteSentCount = contacts.filter(c => c.quoteStatus === 'TEKLIF_VERILDI').length;
      const wonCount = contacts.filter(c => c.result === 'KAZANILDI').length;

      const handleCreate = () => {
            setEditingContact(null);
            setFormData({
                  companyName: '',
                  contactPerson: '',
                  phone: '',
                  email: '',
                  category: 'YENI_INSA',
                  serviceArea: undefined,
                  shipType: '',
                  contactStatus: 'BEKLEMEDE',
                  quoteStatus: 'HAYIR',
                  quoteDate: undefined,
                  result: undefined,
                  notes: '',
            });
            setModalOpen(true);
      };

      const handleEdit = (contact: NetworkContact) => {
            setEditingContact(contact);
            setFormData({
                  companyName: contact.companyName,
                  contactPerson: contact.contactPerson,
                  phone: contact.phone || '',
                  email: contact.email || '',
                  category: contact.category,
                  serviceArea: contact.serviceArea,
                  shipType: contact.shipType || '',
                  contactStatus: contact.contactStatus,
                  quoteStatus: contact.quoteStatus,
                  quoteDate: contact.quoteDate?.toDate(),
                  result: contact.result,
                  notes: contact.notes || '',
            });
            setModalOpen(true);
      };

      const handleDelete = async (id: string) => {
            if (window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
                  try {
                        const user = currentUserAuth ? {
                              uid: currentUserAuth.uid,
                              email: currentUserAuth.email,
                              displayName: currentUserProfile?.displayName
                        } : undefined;
                        await deleteNetworkContact(id, user);
                        fetchData();
                  } catch (error) {
                        console.error("Error deleting contact:", error);
                        alert("Silme işlemi başarısız oldu.");
                  }
            }
      };

      const handleRestore = async (id: string) => {
            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email,
                        displayName: currentUserProfile?.displayName
                  } : undefined;
                  await restoreNetworkContact(id, user);
                  fetchData();
            } catch (error) {
                  console.error("Error restoring contact:", error);
                  alert("Geri yükleme işlemi başarısız oldu.");
            }
      };

      const handleHistory = async (contact: NetworkContact) => {
            setSelectedContactName(contact.companyName);
            setHistoryLoading(true);
            setHistoryModalOpen(true);
            try {
                  const history = await getNetworkHistory(contact.id);
                  setHistoryData(history);
            } catch (error) {
                  console.error("Error fetching history:", error);
                  setHistoryData([]);
            } finally {
                  setHistoryLoading(false);
            }
      };

      const handleHardDelete = async (id: string) => {
            if (window.confirm("DİKKAT: Bu kayıt KALICI OLARAK silinecek! Geri alınamaz. Emin misiniz?")) {
                  try {
                        await hardDeleteNetworkContact(id);
                        fetchData();
                  } catch (error) {
                        console.error("Error hard deleting contact:", error);
                        alert("Kalıcı silme işlemi başarısız oldu.");
                  }
            }
      };

      const handleFormSubmit = async () => {
            if (!formData.companyName || !formData.contactPerson) {
                  alert("Firma adı ve ilgili kişi zorunludur.");
                  return;
            }

            setSubmitting(true);
            try {
                  const user = currentUserAuth ? {
                        uid: currentUserAuth.uid,
                        email: currentUserAuth.email,
                        displayName: currentUserProfile?.displayName
                  } : undefined;

                  if (editingContact) {
                        await updateNetworkContact(editingContact.id, formData, user);
                  } else {
                        await createNetworkContact(formData, user);
                  }
                  setModalOpen(false);
                  fetchData();
            } catch (error) {
                  console.error("Error saving contact:", error);
                  alert("Kaydetme işlemi başarısız oldu.");
            } finally {
                  setSubmitting(false);
            }
      };

      const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
            setTabValue(newValue);
      };

      // Import seed data
      const handleImportData = async () => {
            if (window.confirm(`${networkSeedData.length} kayıt eklenecek. Onaylıyor musunuz?`)) {
                  setLoading(true);
                  try {
                        const user = currentUserAuth ? {
                              uid: currentUserAuth.uid,
                              email: currentUserAuth.email,
                              displayName: currentUserProfile?.displayName
                        } : undefined;

                        let successCount = 0;
                        for (const data of networkSeedData) {
                              // Skip if no company name and no contact person
                              if (!data.companyName && !data.contactPerson) continue;
                              
                              // Use contact person as company name if empty
                              const contactData = {
                                    ...data,
                                    companyName: data.companyName || data.contactPerson,
                              };
                              
                              await createNetworkContact(contactData, user);
                              successCount++;
                        }
                        alert(`${successCount} kayıt başarıyla eklendi!`);
                        fetchData();
                  } catch (error) {
                        console.error("Error importing data:", error);
                        alert("Veri yükleme sırasında hata oluştu.");
                  } finally {
                        setLoading(false);
                  }
            }
      };

      const getCategoryIcon = (category: NetworkCategory) => {
            switch (category) {
                  case 'YENI_INSA': return <DirectionsBoatIcon fontSize="small" />;
                  case 'TAMIR': return <BuildIcon fontSize="small" />;
                  case 'YAT': return <SailingIcon fontSize="small" />;
                  default: return <BusinessIcon fontSize="small" />;
            }
      };

      const getCategoryColor = (category: NetworkCategory) => {
            switch (category) {
                  case 'YENI_INSA': return 'primary';
                  case 'TAMIR': return 'warning';
                  case 'YAT': return 'info';
                  case 'ASKERI_PROJE': return 'error';
                  case 'TANKER': return 'secondary';
                  default: return 'default';
            }
      };

      const getContactStatusColor = (status: ContactStatus) => {
            switch (status) {
                  case 'ULASILDI': return 'success';
                  case 'ULASILMIYOR': return 'error';
                  default: return 'warning';
            }
      };

      const getQuoteStatusColor = (status: QuoteStatus) => {
            switch (status) {
                  case 'TEKLIF_VERILDI': return 'success';
                  case 'TEKLIF_BEKLENIYOR': return 'info';
                  case 'GORUSME_DEVAM_EDIYOR': return 'warning';
                  case 'TEKLIF_VERILECEK': return 'secondary';
                  default: return 'default';
            }
      };

      const getResultColor = (result?: ResultStatus) => {
            switch (result) {
                  case 'KAZANILDI': return 'success';
                  case 'RED': return 'error';
                  case 'IS_YOK': return 'warning';
                  case 'DONUS_YOK': return 'default';
                  default: return 'info';
            }
      };

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
                                    ? `linear-gradient(135deg, ${alpha(theme.palette.info.dark, 0.3)} 0%, ${alpha('#0f172a', 0.9)} 100%)`
                                    : `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.15)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
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
                                                            ? `linear-gradient(135deg, #fff 0%, ${theme.palette.info.light} 100%)`
                                                            : `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${theme.palette.info.main} 100%)`,
                                                      backgroundClip: 'text',
                                                      WebkitBackgroundClip: 'text',
                                                      WebkitTextFillColor: 'transparent',
                                                }}
                                          >
                                                Network
                                          </Typography>
                                          <Typography variant="body1" color="text.secondary">
                                                İş bağlantılarınızı ve müşteri ilişkilerinizi takip edin
                                          </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={2} flexWrap="wrap">
                                          {currentUserProfile?.role === 'ADMIN' && (
                                                <Tooltip title="Excel verilerini yükle">
                                                      <Button
                                                            variant="outlined"
                                                            startIcon={<CloudUploadIcon />}
                                                            onClick={handleImportData}
                                                            sx={{ 
                                                                  borderColor: alpha(theme.palette.divider, 0.3),
                                                                  color: 'text.secondary',
                                                                  '&:hover': {
                                                                        borderColor: theme.palette.info.main,
                                                                        color: 'info.main',
                                                                  },
                                                            }}
                                                      >
                                                            İçe Aktar
                                                      </Button>
                                                </Tooltip>
                                          )}
                                          <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={handleCreate}
                                                sx={{ 
                                                      px: 4,
                                                      background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                                                      boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.3)}`,
                                                }}
                                          >
                                                Yeni Kayıt
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
                                                                        background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <BusinessIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h4" fontWeight={700}>
                                                                        {totalContacts}
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
                                                                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <PhoneIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h4" fontWeight={700}>
                                                                        {contactedCount}
                                                                  </Typography>
                                                                  <Typography variant="body2" color="text.secondary">
                                                                        Ulaşılan
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
                                                                        background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <HandshakeIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h4" fontWeight={700}>
                                                                        {quoteSentCount}
                                                                  </Typography>
                                                                  <Typography variant="body2" color="text.secondary">
                                                                        Teklif Verilen
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
                                                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                                  }}
                                                            >
                                                                  <CheckCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                                                            </Box>
                                                            <Box>
                                                                  <Typography variant="h4" fontWeight={700}>
                                                                        {wonCount}
                                                                  </Typography>
                                                                  <Typography variant="body2" color="text.secondary">
                                                                        Kazanılan
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
                              }}
                        >
                              <Tabs 
                                    value={tabValue} 
                                    onChange={handleTabChange}
                                    sx={{ px: 2 }}
                              >
                                    <Tab label="Aktif Kayıtlar" />
                                    <Tab label="Silinen Kayıtlar" />
                              </Tabs>
                        </Paper>

                        {/* Filters */}
                        <Paper 
                              elevation={0} 
                              sx={{ 
                                    p: 3, 
                                    mb: 3, 
                                    borderRadius: 4,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              }}
                        >
                              <Box display="flex" alignItems="center" gap={1} mb={2}>
                                    <FilterListIcon color="action" />
                                    <Typography variant="subtitle1" fontWeight={600}>Filtreler</Typography>
                              </Box>
                              <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <TextField
                                                fullWidth
                                                placeholder="Ara... (Firma, Kişi, Telefon)"
                                                size="small"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                InputProps={{
                                                      startAdornment: (
                                                            <InputAdornment position="start">
                                                                  <SearchIcon fontSize="small" />
                                                            </InputAdornment>
                                                      ),
                                                }}
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <FormControl fullWidth size="small">
                                                <InputLabel>Kategori</InputLabel>
                                                <Select
                                                      value={filterCategory}
                                                      label="Kategori"
                                                      onChange={(e) => setFilterCategory(e.target.value)}
                                                >
                                                      <MenuItem value="ALL">Tümü</MenuItem>
                                                      <MenuItem value="YENI_INSA">Yeni İnşa</MenuItem>
                                                      <MenuItem value="TAMIR">Tamir</MenuItem>
                                                      <MenuItem value="YAT">Yat</MenuItem>
                                                      <MenuItem value="ASKERI_PROJE">Askeri Proje</MenuItem>
                                                      <MenuItem value="TANKER">Tanker</MenuItem>
                                                      <MenuItem value="DIGER">Diğer</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <FormControl fullWidth size="small">
                                                <InputLabel>İletişim Durumu</InputLabel>
                                                <Select
                                                      value={filterContactStatus}
                                                      label="İletişim Durumu"
                                                      onChange={(e) => setFilterContactStatus(e.target.value)}
                                                >
                                                      <MenuItem value="ALL">Tümü</MenuItem>
                                                      <MenuItem value="ULASILDI">Ulaşıldı</MenuItem>
                                                      <MenuItem value="ULASILMIYOR">Ulaşılmıyor</MenuItem>
                                                      <MenuItem value="BEKLEMEDE">Beklemede</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                          <FormControl fullWidth size="small">
                                                <InputLabel>Teklif Durumu</InputLabel>
                                                <Select
                                                      value={filterQuoteStatus}
                                                      label="Teklif Durumu"
                                                      onChange={(e) => setFilterQuoteStatus(e.target.value)}
                                                >
                                                      <MenuItem value="ALL">Tümü</MenuItem>
                                                      <MenuItem value="HAYIR">Hayır</MenuItem>
                                                      <MenuItem value="TEKLIF_BEKLENIYOR">Teklif Bekleniyor</MenuItem>
                                                      <MenuItem value="TEKLIF_VERILDI">Teklif Verildi</MenuItem>
                                                      <MenuItem value="TEKLIF_VERILECEK">Teklif Verilecek</MenuItem>
                                                      <MenuItem value="GORUSME_DEVAM_EDIYOR">Görüşme Devam Ediyor</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                              </Grid>
                        </Paper>

                        {/* Table */}
                        <TableContainer 
                              component={Paper} 
                              elevation={0}
                              sx={{ 
                                    borderRadius: 4,
                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              }}
                        >
                              <Table>
                                    <TableHead>
                                          <TableRow>
                                                <TableCell>Firma Adı</TableCell>
                                                <TableCell>İlgili Kişi</TableCell>
                                                <TableCell>Telefon</TableCell>
                                                <TableCell>Kategori</TableCell>
                                                <TableCell>Alan</TableCell>
                                                <TableCell>İletişim</TableCell>
                                                <TableCell>Teklif</TableCell>
                                                <TableCell>Sonuç</TableCell>
                                                <TableCell>Notlar</TableCell>
                                                <TableCell align="right">İşlemler</TableCell>
                                          </TableRow>
                                    </TableHead>
                                    <TableBody>
                                          {filteredContacts.length === 0 ? (
                                                <TableRow>
                                                      <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                                                            <Typography color="text.secondary">
                                                                  {tabValue === 0 ? 'Henüz kayıt yok' : 'Silinen kayıt yok'}
                                                            </Typography>
                                                      </TableCell>
                                                </TableRow>
                                          ) : (
                                                filteredContacts.map((contact) => (
                                                      <TableRow key={contact.id} hover>
                                                            <TableCell>
                                                                  <Typography fontWeight={600}>
                                                                        {contact.companyName}
                                                                  </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                  <Box display="flex" alignItems="center" gap={1}>
                                                                        <PersonIcon fontSize="small" color="action" />
                                                                        {contact.contactPerson}
                                                                  </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                  {contact.phone && (
                                                                        <Box display="flex" alignItems="center" gap={1}>
                                                                              <PhoneIcon fontSize="small" color="action" />
                                                                              {contact.phone}
                                                                        </Box>
                                                                  )}
                                                            </TableCell>
                                                            <TableCell>
                                                                  <Chip
                                                                        icon={getCategoryIcon(contact.category)}
                                                                        label={getCategoryLabel(contact.category)}
                                                                        size="small"
                                                                        color={getCategoryColor(contact.category) as any}
                                                                        variant="outlined"
                                                                  />
                                                            </TableCell>
                                                            <TableCell>
                                                                  {contact.serviceArea && (
                                                                        <Chip
                                                                              label={getServiceAreaLabel(contact.serviceArea)}
                                                                              size="small"
                                                                              variant="outlined"
                                                                        />
                                                                  )}
                                                            </TableCell>
                                                            <TableCell>
                                                                  <Chip
                                                                        label={getContactStatusLabel(contact.contactStatus)}
                                                                        size="small"
                                                                        color={getContactStatusColor(contact.contactStatus) as any}
                                                                  />
                                                            </TableCell>
                                                            <TableCell>
                                                                  <Chip
                                                                        label={getQuoteStatusLabel(contact.quoteStatus)}
                                                                        size="small"
                                                                        color={getQuoteStatusColor(contact.quoteStatus) as any}
                                                                        variant="filled"
                                                                  />
                                                            </TableCell>
                                                            <TableCell>
                                                                  {contact.result && (
                                                                        <Chip
                                                                              label={getResultStatusLabel(contact.result)}
                                                                              size="small"
                                                                              color={getResultColor(contact.result) as any}
                                                                        />
                                                                  )}
                                                            </TableCell>
                                                            <TableCell>
                                                                  <Tooltip title={contact.notes || ''}>
                                                                        <Typography 
                                                                              variant="body2" 
                                                                              sx={{ 
                                                                                    maxWidth: 150, 
                                                                                    overflow: 'hidden',
                                                                                    textOverflow: 'ellipsis',
                                                                                    whiteSpace: 'nowrap',
                                                                              }}
                                                                        >
                                                                              {contact.notes || '-'}
                                                                        </Typography>
                                                                  </Tooltip>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                  {tabValue === 0 ? (
                                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                                              <Tooltip title="Geçmiş">
                                                                                    <IconButton 
                                                                                          size="small" 
                                                                                          onClick={() => handleHistory(contact)}
                                                                                          sx={{ color: 'info.main' }}
                                                                                    >
                                                                                          <HistoryIcon fontSize="small" />
                                                                                    </IconButton>
                                                                              </Tooltip>
                                                                              <Tooltip title="Düzenle">
                                                                                    <IconButton 
                                                                                          size="small" 
                                                                                          onClick={() => handleEdit(contact)}
                                                                                          sx={{ color: 'primary.main' }}
                                                                                    >
                                                                                          <EditIcon fontSize="small" />
                                                                                    </IconButton>
                                                                              </Tooltip>
                                                                              <Tooltip title="Sil">
                                                                                    <IconButton 
                                                                                          size="small" 
                                                                                          onClick={() => handleDelete(contact.id)}
                                                                                          sx={{ color: 'error.main' }}
                                                                                    >
                                                                                          <DeleteIcon fontSize="small" />
                                                                                    </IconButton>
                                                                              </Tooltip>
                                                                        </Stack>
                                                                  ) : (
                                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                                              <Tooltip title="Geçmiş">
                                                                                    <IconButton 
                                                                                          size="small" 
                                                                                          onClick={() => handleHistory(contact)}
                                                                                          sx={{ color: 'info.main' }}
                                                                                    >
                                                                                          <HistoryIcon fontSize="small" />
                                                                                    </IconButton>
                                                                              </Tooltip>
                                                                              <Tooltip title="Geri Yükle">
                                                                                    <IconButton 
                                                                                          size="small" 
                                                                                          onClick={() => handleRestore(contact.id)}
                                                                                          sx={{ color: 'success.main' }}
                                                                                    >
                                                                                          <RestoreIcon fontSize="small" />
                                                                                    </IconButton>
                                                                              </Tooltip>
                                                                              <Tooltip title="Kalıcı Sil">
                                                                                    <IconButton 
                                                                                          size="small" 
                                                                                          onClick={() => handleHardDelete(contact.id)}
                                                                                          sx={{ color: 'error.main' }}
                                                                                    >
                                                                                          <DeleteForeverIcon fontSize="small" />
                                                                                    </IconButton>
                                                                              </Tooltip>
                                                                        </Stack>
                                                                  )}
                                                            </TableCell>
                                                      </TableRow>
                                                ))
                                          )}
                                    </TableBody>
                              </Table>
                        </TableContainer>
                  </Container>

                  {/* Add/Edit Modal */}
                  <Dialog 
                        open={modalOpen} 
                        onClose={() => setModalOpen(false)}
                        maxWidth="md"
                        fullWidth
                  >
                        <DialogTitle sx={{ fontWeight: 700 }}>
                              {editingContact ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}
                        </DialogTitle>
                        <DialogContent dividers>
                              <Grid container spacing={3} sx={{ mt: 0 }}>
                                    {/* Firma Bilgileri */}
                                    <Grid size={{ xs: 12 }}>
                                          <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
                                                Firma Bilgileri
                                          </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                                fullWidth
                                                label="Firma Adı *"
                                                value={formData.companyName}
                                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                                fullWidth
                                                label="İlgili Kişi *"
                                                value={formData.contactPerson}
                                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                                fullWidth
                                                label="Telefon"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                          />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                                fullWidth
                                                label="E-posta"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                          />
                                    </Grid>

                                    {/* Kategorilendirme */}
                                    <Grid size={{ xs: 12 }}>
                                          <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                                                Kategorilendirme
                                          </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Kategori</InputLabel>
                                                <Select
                                                      value={formData.category}
                                                      label="Kategori"
                                                      onChange={(e) => setFormData({ ...formData, category: e.target.value as NetworkCategory })}
                                                >
                                                      <MenuItem value="YENI_INSA">Yeni İnşa</MenuItem>
                                                      <MenuItem value="TAMIR">Tamir</MenuItem>
                                                      <MenuItem value="YAT">Yat</MenuItem>
                                                      <MenuItem value="ASKERI_PROJE">Askeri Proje</MenuItem>
                                                      <MenuItem value="TANKER">Tanker</MenuItem>
                                                      <MenuItem value="DIGER">Diğer</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Hizmet Alanı</InputLabel>
                                                <Select
                                                      value={formData.serviceArea || ''}
                                                      label="Hizmet Alanı"
                                                      onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value as ServiceArea || undefined })}
                                                >
                                                      <MenuItem value="">Seçiniz</MenuItem>
                                                      <MenuItem value="BORU">Boru</MenuItem>
                                                      <MenuItem value="BORU_TECHIZ">Boru Techiz</MenuItem>
                                                      <MenuItem value="DIGER">Diğer</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                          <TextField
                                                fullWidth
                                                label="Gemi Tipi"
                                                value={formData.shipType}
                                                onChange={(e) => setFormData({ ...formData, shipType: e.target.value })}
                                                placeholder="ör: Tanker, Tamir gemisi"
                                          />
                                    </Grid>

                                    {/* Durum Takibi */}
                                    <Grid size={{ xs: 12 }}>
                                          <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                                                Durum Takibi
                                          </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>İletişim Durumu</InputLabel>
                                                <Select
                                                      value={formData.contactStatus}
                                                      label="İletişim Durumu"
                                                      onChange={(e) => setFormData({ ...formData, contactStatus: e.target.value as ContactStatus })}
                                                >
                                                      <MenuItem value="BEKLEMEDE">Beklemede</MenuItem>
                                                      <MenuItem value="ULASILDI">Ulaşıldı</MenuItem>
                                                      <MenuItem value="ULASILMIYOR">Ulaşılmıyor</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Teklif Durumu</InputLabel>
                                                <Select
                                                      value={formData.quoteStatus}
                                                      label="Teklif Durumu"
                                                      onChange={(e) => setFormData({ ...formData, quoteStatus: e.target.value as QuoteStatus })}
                                                >
                                                      <MenuItem value="HAYIR">Hayır</MenuItem>
                                                      <MenuItem value="TEKLIF_BEKLENIYOR">Teklif Bekleniyor</MenuItem>
                                                      <MenuItem value="TEKLIF_VERILECEK">Teklif Verilecek</MenuItem>
                                                      <MenuItem value="TEKLIF_VERILDI">Teklif Verildi</MenuItem>
                                                      <MenuItem value="GORUSME_DEVAM_EDIYOR">Görüşme Devam Ediyor</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                          <FormControl fullWidth>
                                                <InputLabel>Sonuç</InputLabel>
                                                <Select
                                                      value={formData.result || ''}
                                                      label="Sonuç"
                                                      onChange={(e) => setFormData({ ...formData, result: e.target.value as ResultStatus || undefined })}
                                                >
                                                      <MenuItem value="">Seçiniz</MenuItem>
                                                      <MenuItem value="BEKLEMEDE">Beklemede</MenuItem>
                                                      <MenuItem value="KAZANILDI">Kazanıldı</MenuItem>
                                                      <MenuItem value="RED">Red</MenuItem>
                                                      <MenuItem value="IS_YOK">İş Yok</MenuItem>
                                                      <MenuItem value="DONUS_YOK">Dönüş Yok</MenuItem>
                                                </Select>
                                          </FormControl>
                                    </Grid>

                                    {/* Notlar */}
                                    <Grid size={{ xs: 12 }}>
                                          <TextField
                                                fullWidth
                                                label="Notlar"
                                                multiline
                                                rows={3}
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="Ek notlar..."
                                          />
                                    </Grid>
                              </Grid>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, py: 2 }}>
                              <Button onClick={() => setModalOpen(false)} color="inherit">
                                    İptal
                              </Button>
                              <Button 
                                    onClick={handleFormSubmit} 
                                    variant="contained"
                                    disabled={submitting}
                              >
                                    {submitting ? 'Kaydediliyor...' : (editingContact ? 'Güncelle' : 'Kaydet')}
                              </Button>
                        </DialogActions>
                  </Dialog>

                  {/* History Modal */}
                  <HistoryModal
                        open={historyModalOpen}
                        onClose={() => setHistoryModalOpen(false)}
                        title={`${selectedContactName} - Değişiklik Geçmişi`}
                        history={historyData as any}
                        loading={historyLoading}
                  />
            </Box>
      );
};

export default NetworkPage;
