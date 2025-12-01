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
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Partner } from '../types/Partner';
import { getPartners, togglePartnerActive, seedPartnersData } from '../services/partners';
import { useAuth } from '../context/AuthContext';
import PartnerFormModal from '../components/PartnerFormModal';

const PartnersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserAuth, currentUserProfile } = useAuth();
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Ortakları yükle
  const loadPartners = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPartners();
      // showInactive false ise sadece aktif olanları göster
      const filteredData = showInactive ? data : data.filter(p => p.isActive);
      setPartners(filteredData);
    } catch (err) {
      console.error('Ortaklar yüklenirken hata:', err);
      setError('Ortaklar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  // Örnek verileri yükle
  const handleSeedData = async () => {
    if (!window.confirm('Excel\'deki örnek veriler (3 ortak + 6 dönem) eklenecek. Devam etmek istiyor musunuz?')) {
      return;
    }
    
    try {
      setSeeding(true);
      setError(null);
      
      await seedPartnersData(
        currentUserAuth ? {
          uid: currentUserAuth.uid,
          email: currentUserAuth.email || '',
          displayName: currentUserAuth.displayName || '',
        } : undefined
      );
      
      loadPartners();
      alert('✅ Örnek veriler başarıyla eklendi!');
    } catch (err) {
      console.error('Örnek veriler eklenirken hata:', err);
      setError('Örnek veriler eklenirken bir hata oluştu.');
    } finally {
      setSeeding(false);
    }
  };

  // Ortak durumunu değiştir (aktif/pasif)
  const handleToggleActive = async (partner: Partner) => {
    try {
      await togglePartnerActive(
        partner.id,
        !partner.isActive,
        currentUserAuth ? {
          uid: currentUserAuth.uid,
          email: currentUserAuth.email || '',
          displayName: currentUserAuth.displayName || '',
        } : undefined
      );
      loadPartners();
    } catch (err) {
      console.error('Ortak durumu değiştirilirken hata:', err);
      setError('Ortak durumu değiştirilirken bir hata oluştu.');
    }
  };

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Başlık ve Butonlar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight="bold">
          Ortaklar
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {/* Örnek veri yükle butonu - sadece veri yoksa göster */}
          {partners.length === 0 && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleSeedData}
              startIcon={<CloudUploadIcon />}
              disabled={seeding}
            >
              {seeding ? 'Yükleniyor...' : 'Örnek Veri Yükle'}
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => setShowInactive(!showInactive)}
            startIcon={showInactive ? <ToggleOnIcon /> : <ToggleOffIcon />}
          >
            {showInactive ? 'Pasifleri Gizle' : 'Pasifleri Göster'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingPartner(null);
              setShowFormModal(true);
            }}
          >
            Yeni Ortak Ekle
          </Button>
        </Box>
      </Box>

      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Ortak Tablosu */}
      <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ortak Adı</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Hisse Oranı (%)</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Aylık Maaş</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Güncel Bakiye</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Durum</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Henüz ortak kaydı bulunmamaktadır.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              partners.map((partner) => {
                const balanceInfo = getBalanceDescription(partner.currentBalance);
                return (
                  <TableRow 
                    key={partner.id} 
                    hover
                    sx={{ 
                      opacity: partner.isActive ? 1 : 0.6,
                      backgroundColor: partner.isActive ? 'inherit' : 'action.hover',
                    }}
                  >
                    <TableCell>
                      <Typography fontWeight="medium">{partner.name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={`%${partner.sharePercentage}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(partner.baseSalary)}
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography 
                          fontWeight="bold" 
                          sx={{ color: balanceInfo.color }}
                        >
                          {formatCurrency(partner.currentBalance)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: balanceInfo.color }}>
                          {balanceInfo.text}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={partner.isActive ? 'Aktif' : 'Pasif'}
                        size="small"
                        color={partner.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1}>
                        <Tooltip title="Detay">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/partners/${partner.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {currentUserProfile?.role === 'ADMIN' && (
                          <>
                            <Tooltip title="Düzenle">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => {
                                  setEditingPartner(partner);
                                  setShowFormModal(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={partner.isActive ? 'Pasifleştir' : 'Aktifleştir'}>
                              <IconButton
                                size="small"
                                color={partner.isActive ? 'warning' : 'success'}
                                onClick={() => handleToggleActive(partner)}
                              >
                                {partner.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Toplam Hisse Kontrolü */}
      {partners.length > 0 && (
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Toplam Hisse Oranı:{' '}
              <Typography 
                component="span" 
                fontWeight="bold"
                color={
                  partners.filter(p => p.isActive).reduce((sum, p) => sum + p.sharePercentage, 0) === 100 
                    ? 'success.main' 
                    : 'warning.main'
                }
              >
                %{partners.filter(p => p.isActive).reduce((sum, p) => sum + p.sharePercentage, 0)}
              </Typography>
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Form Modal */}
      <PartnerFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingPartner(null);
        }}
        onSuccess={() => {
          setShowFormModal(false);
          setEditingPartner(null);
          loadPartners();
        }}
        partner={editingPartner}
      />
    </Box>
  );
};

export default PartnersPage;
