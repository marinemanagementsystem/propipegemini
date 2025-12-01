import React, { useState } from 'react';
import {
      Box,
      Paper,
      Typography,
      TextField,
      Button,
      Alert,
      alpha,
      InputAdornment,
      IconButton,
      Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUsers } from '../utils/createUsers';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

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

      const handleCreateAllUsers = async () => {
            setLoading(true);
            setError('');
            setSuccessMsg('');
            try {
                  const results = await createUsers();
                  const successCount = results.filter(r => r.success).length;
                  const existingCount = results.filter(r => r.error === 'Already exists').length;
                  
                  if (successCount > 0 || existingCount > 0) {
                        setSuccessMsg(`${successCount} kullanıcı oluşturuldu, ${existingCount} kullanıcı zaten mevcut.`);
                  } else {
                        setError('Kullanıcı oluşturulamadı.');
                  }
            } catch (err: any) {
                  setError('Bir hata oluştu: ' + err.message);
            } finally {
                  setLoading(false);
            }
      };

      return (
            <Box
                  sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        position: 'relative',
                        overflow: 'hidden',
                  }}
            >
                  {/* Left Side - Branding */}
                  <Box
                        sx={{
                              display: { xs: 'none', md: 'flex' },
                              flex: 1,
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${alpha(theme.palette.secondary.main, 0.8)} 100%)`,
                              position: 'relative',
                              p: 6,
                        }}
                  >
                        {/* Animated background circles */}
                        <Box
                              sx={{
                                    position: 'absolute',
                                    top: '10%',
                                    left: '10%',
                                    width: 300,
                                    height: 300,
                                    borderRadius: '50%',
                                    background: alpha('#fff', 0.05),
                                    animation: 'float 6s ease-in-out infinite',
                                    '@keyframes float': {
                                          '0%, 100%': { transform: 'translateY(0px)' },
                                          '50%': { transform: 'translateY(-20px)' },
                                    },
                              }}
                        />
                        <Box
                              sx={{
                                    position: 'absolute',
                                    bottom: '15%',
                                    right: '15%',
                                    width: 200,
                                    height: 200,
                                    borderRadius: '50%',
                                    background: alpha('#fff', 0.08),
                                    animation: 'float 8s ease-in-out infinite reverse',
                              }}
                        />
                        <Box
                              sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: '5%',
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    background: alpha('#fff', 0.03),
                                    animation: 'float 5s ease-in-out infinite',
                              }}
                        />

                        {/* Logo */}
                        <Box
                              component="img"
                              src="/logo.jpg"
                              alt="PRO PIPE|STEEL Logo"
                              sx={{
                                    width: 160,
                                    height: 160,
                                    borderRadius: 5,
                                    objectFit: 'cover',
                                    mb: 4,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                                    border: '4px solid rgba(255,255,255,0.2)',
                                    transition: 'transform 0.4s ease',
                                    '&:hover': {
                                          transform: 'scale(1.05) rotate(2deg)',
                                    },
                              }}
                        />

                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                              <Typography
                                    component="span"
                                    sx={{
                                          fontSize: '3.5rem',
                                          fontWeight: 300,
                                          color: 'white',
                                          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                          letterSpacing: '0.15em',
                                          fontFamily: '"Roboto", "Helvetica", sans-serif',
                                    }}
                              >
                                    PRO{' '}
                              </Typography>
                              <Typography
                                    component="span"
                                    sx={{
                                          fontSize: '3.5rem',
                                          fontWeight: 700,
                                          color: 'white',
                                          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                                          letterSpacing: '0.05em',
                                    }}
                              >
                                    PIPE
                              </Typography>
                              <Typography
                                    component="span"
                                    sx={{
                                          fontSize: '3.5rem',
                                          fontWeight: 300,
                                          color: alpha('#fff', 0.6),
                                          mx: 0.5,
                                    }}
                              >
                                    |
                              </Typography>
                              <Typography
                                    component="span"
                                    sx={{
                                          fontSize: '3.5rem',
                                          fontWeight: 700,
                                          background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                                          backgroundClip: 'text',
                                          WebkitBackgroundClip: 'text',
                                          WebkitTextFillColor: 'transparent',
                                          letterSpacing: '0.05em',
                                    }}
                              >
                                    STEEL
                              </Typography>
                        </Box>

                        <Typography
                              sx={{
                                    color: alpha('#fff', 0.5),
                                    fontWeight: 200,
                                    textAlign: 'center',
                                    letterSpacing: '0.5em',
                                    textTransform: 'uppercase',
                                    fontSize: '0.9rem',
                                    mt: 1,
                              }}
                        >
                              SOLUTION
                        </Typography>

                        <Box
                              sx={{
                                    mt: 6,
                                    p: 3,
                                    borderRadius: 4,
                                    bgcolor: alpha('#fff', 0.1),
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                              }}
                        >
                              <Typography variant="body2" sx={{ color: alpha('#fff', 0.9), textAlign: 'center' }}>
                                    ✓ Tersane Yönetimi &nbsp; ✓ Gider Takibi &nbsp; ✓ Network CRM
                              </Typography>
                        </Box>
                  </Box>

                  {/* Right Side - Login Form */}
                  <Box
                        sx={{
                              flex: { xs: 1, md: '0 0 500px' },
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              bgcolor: isDark ? '#0f172a' : '#f8fafc',
                              p: { xs: 3, sm: 6 },
                              position: 'relative',
                        }}
                  >
                        {/* Mobile Logo */}
                        <Box
                              sx={{
                                    display: { xs: 'block', md: 'none' },
                                    textAlign: 'center',
                                    mb: 4,
                              }}
                        >
                              <Box
                                    component="img"
                                    src="/logo.jpg"
                                    alt="PRO PIPE|STEEL Logo"
                                    sx={{
                                          width: 100,
                                          height: 100,
                                          borderRadius: 4,
                                          objectFit: 'cover',
                                          mb: 2,
                                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                                    }}
                              />
                              <Box>
                                    <Typography
                                          component="span"
                                          sx={{
                                                fontSize: '1.75rem',
                                                fontWeight: 300,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                                backgroundClip: 'text',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                letterSpacing: '0.1em',
                                          }}
                                    >
                                          PRO{' '}
                                    </Typography>
                                    <Typography
                                          component="span"
                                          sx={{
                                                fontSize: '1.75rem',
                                                fontWeight: 700,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                                backgroundClip: 'text',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                          }}
                                    >
                                          PIPE
                                    </Typography>
                                    <Typography
                                          component="span"
                                          sx={{
                                                fontSize: '1.75rem',
                                                fontWeight: 300,
                                                color: 'text.secondary',
                                                mx: 0.3,
                                          }}
                                    >
                                          |
                                    </Typography>
                                    <Typography
                                          component="span"
                                          sx={{
                                                fontSize: '1.75rem',
                                                fontWeight: 700,
                                                background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                                                backgroundClip: 'text',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                          }}
                                    >
                                          STEEL
                                    </Typography>
                              </Box>
                        </Box>

                        <Paper
                              elevation={0}
                              sx={{
                                    p: { xs: 3, sm: 5 },
                                    borderRadius: 5,
                                    width: '100%',
                                    maxWidth: 400,
                                    bgcolor: isDark ? alpha('#1e293b', 0.8) : '#ffffff',
                                    border: `1px solid ${isDark ? alpha('#94a3b8', 0.1) : alpha('#e2e8f0', 1)}`,
                                    boxShadow: isDark
                                          ? '0 20px 50px rgba(0,0,0,0.4)'
                                          : '0 20px 50px rgba(0,0,0,0.08)',
                              }}
                        >
                              <Typography variant="h5" fontWeight={700} mb={1}>
                                    Hoş Geldiniz 👋
                              </Typography>
                              <Typography variant="body2" color="text.secondary" mb={4}>
                                    Hesabınıza giriş yapın
                              </Typography>

                              {error && (
                                    <Alert 
                                          severity="error" 
                                          sx={{ 
                                                mb: 3, 
                                                borderRadius: 3,
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
                                          }}
                                    >
                                          {successMsg}
                                    </Alert>
                              )}

                              <Box component="form" onSubmit={handleSubmit}>
                                    <Typography variant="subtitle2" fontWeight={600} mb={1}>
                                          E-posta
                                    </Typography>
                                    <TextField
                                          placeholder="ornek@email.com"
                                          type="email"
                                          fullWidth
                                          size="medium"
                                          value={email}
                                          onChange={(e) => setEmail(e.target.value)}
                                          required
                                          autoFocus
                                          sx={{ mb: 3 }}
                                          InputProps={{
                                                startAdornment: (
                                                      <InputAdornment position="start">
                                                            <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                      </InputAdornment>
                                                ),
                                          }}
                                    />

                                    <Typography variant="subtitle2" fontWeight={600} mb={1}>
                                          Şifre
                                    </Typography>
                                    <TextField
                                          placeholder="••••••••"
                                          type={showPassword ? 'text' : 'password'}
                                          fullWidth
                                          size="medium"
                                          value={password}
                                          onChange={(e) => setPassword(e.target.value)}
                                          required
                                          sx={{ mb: 1 }}
                                          InputProps={{
                                                startAdornment: (
                                                      <InputAdornment position="start">
                                                            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                                      </InputAdornment>
                                                ),
                                                endAdornment: (
                                                      <InputAdornment position="end">
                                                            <IconButton
                                                                  onClick={() => setShowPassword(!showPassword)}
                                                                  edge="end"
                                                                  size="small"
                                                            >
                                                                  {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
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
                                                py: 1.5,
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                borderRadius: 3,
                                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                                                '&:hover': {
                                                      boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                                                },
                                          }}
                                    >
                                          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                                    </Button>
                              </Box>

                              <Divider sx={{ my: 3 }}>
                                    <Typography variant="caption" color="text.secondary">
                                          Yönetici
                                    </Typography>
                              </Divider>

                              <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={handleCreateAllUsers}
                                    disabled={loading}
                                    startIcon={<GroupAddIcon />}
                                    sx={{
                                          py: 1.2,
                                          borderRadius: 3,
                                          borderColor: alpha(theme.palette.divider, 0.3),
                                          color: 'text.secondary',
                                          '&:hover': {
                                                borderColor: theme.palette.primary.main,
                                                color: 'primary.main',
                                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                          },
                                    }}
                              >
                                    Kullanıcıları Oluştur
                              </Button>
                        </Paper>

                        <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ mt: 4, textAlign: 'center' }}
                        >
                              © 2025 PRO PIPE|STEEL SOLUTION. Tüm hakları saklıdır.
                        </Typography>
                  </Box>
            </Box>
      );
};

export default LoginPage;
