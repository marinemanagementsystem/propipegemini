import React, { useState } from 'react';
import {
      Box,
      Paper,
      Typography,
      TextField,
      Button,
      Alert,
      Divider,
      alpha,
      InputAdornment,
      IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createDefaultAdmin } from '../utils/createAdminUser';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const LoginPage: React.FC = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [error, setError] = useState('');
      const [successMsg, setSuccessMsg] = useState('');
      const [loading, setLoading] = useState(false);
      const { login } = useAuth();
      const navigate = useNavigate();
      const theme = useTheme();
      const isDark = theme.palette.mode === 'dark';

      const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            setSuccessMsg('');
            setLoading(true);
            try {
                  await login(email, password);
                  navigate('/expenses');
            } catch (err: any) {
                  console.error('Login error:', err);
                  setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
            } finally {
                  setLoading(false);
            }
      };

      const handleCreateAdmin = async () => {
            setLoading(true);
            setError('');
            setSuccessMsg('');
            try {
                  const result = await createDefaultAdmin();
                  if (result.success) {
                        setSuccessMsg(result.message);
                        setEmail('admin@propipe.com');
                        setPassword('admin123');
                  } else {
                        setError(result.message);
                  }
            } catch (err: any) {
                  setError('Bir hata oluştu.');
            } finally {
                  setLoading(false);
            }
      };

      return (
            <Box
                  sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isDark
                              ? `linear-gradient(135deg, #0f172a 0%, ${alpha(theme.palette.primary.dark, 0.3)} 50%, #0f172a 100%)`
                              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 50%, ${alpha(theme.palette.background.default, 1)} 100%)`,
                        position: 'relative',
                        overflow: 'hidden',
                        p: 2,
                  }}
            >
                  {/* Background decoration */}
                  <Box
                        sx={{
                              position: 'absolute',
                              top: -200,
                              right: -200,
                              width: 600,
                              height: 600,
                              borderRadius: '50%',
                              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
                              pointerEvents: 'none',
                        }}
                  />
                  <Box
                        sx={{
                              position: 'absolute',
                              bottom: -150,
                              left: -150,
                              width: 400,
                              height: 400,
                              borderRadius: '50%',
                              background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
                              pointerEvents: 'none',
                        }}
                  />

                  <Paper
                        elevation={0}
                        sx={{
                              p: { xs: 3, sm: 5 },
                              borderRadius: 5,
                              maxWidth: 420,
                              width: '100%',
                              bgcolor: alpha(theme.palette.background.paper, isDark ? 0.8 : 0.95),
                              backdropFilter: 'blur(20px)',
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              boxShadow: isDark
                                    ? '0 24px 48px rgba(0, 0, 0, 0.4)'
                                    : '0 24px 48px rgba(0, 0, 0, 0.08)',
                              position: 'relative',
                              overflow: 'hidden',
                        }}
                  >
                        {/* Top gradient bar */}
                        <Box
                              sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                              }}
                        />

                        {/* Logo & Header */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                              <Box
                                    component="img"
                                    src="/logo.jpg"
                                    alt="PROPIPE Logo"
                                    sx={{
                                          width: 110,
                                          height: 110,
                                          borderRadius: 4,
                                          objectFit: 'cover',
                                          mx: 'auto',
                                          mb: 3,
                                          border: `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`,
                                          transition: 'transform 0.3s ease',
                                          '&:hover': {
                                                transform: 'scale(1.05)',
                                          },
                                    }}
                              />
                              <Typography
                                    variant="h4"
                                    fontWeight={800}
                                    sx={{
                                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                          backgroundClip: 'text',
                                          WebkitBackgroundClip: 'text',
                                          WebkitTextFillColor: 'transparent',
                                          mb: 0.5,
                                    }}
                              >
                                    PROPIPE
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                    Marine Management System
                              </Typography>
                        </Box>

                        {error && (
                              <Alert 
                                    severity="error" 
                                    sx={{ 
                                          mb: 3, 
                                          borderRadius: 3,
                                          bgcolor: alpha(theme.palette.error.main, 0.1),
                                    }}
                              >
                                    {error}
                              </Alert>
                        )}
                        {successMsg && (
                              <Alert 
                                    severity="success" 
                                    sx={{ 
                                          mb: 3, 
                                          borderRadius: 3,
                                          bgcolor: alpha(theme.palette.success.main, 0.1),
                                    }}
                              >
                                    {successMsg}
                              </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                              <TextField
                                    label="E-posta Adresi"
                                    type="email"
                                    fullWidth
                                    margin="normal"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    InputProps={{
                                          startAdornment: (
                                                <InputAdornment position="start">
                                                      <EmailOutlinedIcon sx={{ color: 'text.secondary' }} />
                                                </InputAdornment>
                                          ),
                                    }}
                              />
                              <TextField
                                    label="Şifre"
                                    type={showPassword ? 'text' : 'password'}
                                    fullWidth
                                    margin="normal"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    InputProps={{
                                          startAdornment: (
                                                <InputAdornment position="start">
                                                      <LockOutlinedIcon sx={{ color: 'text.secondary' }} />
                                                </InputAdornment>
                                          ),
                                          endAdornment: (
                                                <InputAdornment position="end">
                                                      <IconButton
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            edge="end"
                                                            size="small"
                                                      >
                                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                      </IconButton>
                                                </InputAdornment>
                                          ),
                                    }}
                              />
                              <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    startIcon={!loading && <LoginIcon />}
                                    sx={{
                                          mt: 4,
                                          mb: 2,
                                          py: 1.5,
                                          fontSize: '1rem',
                                          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                    }}
                              >
                                    {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                              </Button>
                        </Box>

                        <Divider sx={{ my: 3 }}>
                              <Typography variant="caption" color="text.secondary">
                                    veya
                              </Typography>
                        </Divider>

                        <Button
                              fullWidth
                              variant="outlined"
                              color="secondary"
                              onClick={handleCreateAdmin}
                              disabled={loading}
                              startIcon={<AdminPanelSettingsIcon />}
                              sx={{
                                    py: 1.2,
                                    borderWidth: 1.5,
                                    '&:hover': { borderWidth: 1.5 },
                              }}
                        >
                              Admin Kullanıcısı Oluştur
                        </Button>

                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
                              © 2025 Pro Pipe Manager. Tüm hakları saklıdır.
                        </Typography>
                  </Paper>
            </Box>
      );
};

export default LoginPage;
