import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { CssBaseline, AppBar, Toolbar, Typography, Button, Box, Container, IconButton, Avatar, Tooltip, alpha, Chip, useMediaQuery, Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpensesPage from './pages/ExpensesPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import StatementEditorPage from './pages/StatementEditorPage';
import NetworkPage from './pages/NetworkPage';
import PartnersPage from './pages/PartnersPage';
import PartnerDetailPage from './pages/PartnerDetailPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider, useThemeContext } from './context/ThemeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BusinessIcon from '@mui/icons-material/Business';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

// Layout Component with Modern Navigation
const Layout = ({ children }: { children: React.ReactNode }) => {
  const { currentUserProfile, logout } = useAuth();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/expenses', label: 'Giderler', icon: <ReceiptLongIcon /> },
    { path: '/projects', label: 'Tersaneler', icon: <BusinessIcon /> },
    { path: '/network', label: 'Network', icon: <HandshakeIcon /> },
    { path: '/partners', label: 'Ortaklar', icon: <PeopleIcon /> },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const NavButton = ({ item }: { item: typeof navItems[0] }) => (
    <Button
      component={Link}
      to={item.path}
      startIcon={item.icon}
      sx={{
        color: isActive(item.path) ? 'primary.main' : 'text.secondary',
        fontWeight: isActive(item.path) ? 700 : 500,
        px: 2.5,
        py: 1,
        borderRadius: 2,
        position: 'relative',
        backgroundColor: isActive(item.path) 
          ? alpha(theme.palette.primary.main, 0.08) 
          : 'transparent',
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.12),
        },
        '&::after': isActive(item.path) ? {
          content: '""',
          position: 'absolute',
          bottom: -8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 24,
          height: 3,
          borderRadius: '3px 3px 0 0',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        } : {},
      }}
    >
      {item.label}
    </Button>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      bgcolor: 'background.default', 
      transition: 'background-color 0.3s ease'
    }}>
      {/* Modern AppBar */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
            {/* Logo */}
            <Box 
              component={Link}
              to="/"
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                mr: 4,
                textDecoration: 'none',
              }}
            >
              <Box
                component="img"
                src="/logo.jpg"
                alt="PRO PIPE|STEEL Logo"
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 3,
                  objectFit: 'cover',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.45)}`,
                  },
                }}
              />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Typography 
                    component="span"
                    sx={{ 
                      fontSize: '1.1rem',
                      fontWeight: 300, 
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '0.08em',
                    }}
                  >
                    PRO{' '}
                  </Typography>
                  <Typography 
                    component="span"
                    sx={{ 
                      fontSize: '1.1rem',
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
                      fontSize: '1.1rem',
                      fontWeight: 300, 
                      color: alpha(theme.palette.text.primary, 0.4),
                      mx: 0.3,
                    }}
                  >
                    |
                  </Typography>
                  <Typography 
                    component="span"
                    sx={{ 
                      fontSize: '1.1rem',
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
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.6rem',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}
                >
                  SOLUTION
                </Typography>
              </Box>
            </Box>

            {/* Desktop Navigation */}
            {!isMobile && (
              <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                {navItems.map((item) => (
                  <NavButton key={item.path} item={item} />
                ))}
              </Box>
            )}

            {/* Spacer for mobile */}
            {isMobile && <Box sx={{ flexGrow: 1 }} />}

            {/* Right side actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Theme Toggle */}
              <Tooltip title={mode === 'dark' ? 'Açık Tema' : 'Koyu Tema'}>
                <IconButton 
                  onClick={toggleTheme}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                >
                  {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* User Info - Desktop */}
              {!isMobile && currentUserProfile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      fontSize: '0.9rem',
                      fontWeight: 700,
                    }}
                  >
                    {currentUserProfile.displayName?.charAt(0) || 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
                    <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                      {currentUserProfile.displayName}
                    </Typography>
                    <Chip 
                      label={currentUserProfile.role} 
                      size="small"
                      sx={{ 
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Logout - Desktop */}
              {!isMobile && (
                <Tooltip title="Çıkış Yap">
                  <IconButton 
                    onClick={logout}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'error.main',
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <IconButton 
                  onClick={() => setMobileMenuOpen(true)}
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: 'background.paper',
            p: 2,
          },
        }}
      >
        {/* User Info in Drawer */}
        {currentUserProfile && (
          <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 48, height: 48 }}>
                {currentUserProfile.displayName?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography fontWeight={600}>{currentUserProfile.displayName}</Typography>
                <Chip 
                  label={currentUserProfile.role} 
                  size="small"
                  sx={{ 
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: 'primary.main',
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Navigation Items */}
        <List>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                selected={isActive(item.path)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive(item.path) ? 600 : 400 
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        {/* Logout Button */}
        <Box sx={{ mt: 'auto', pt: 3 }}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            sx={{ borderRadius: 2 }}
          >
            Çıkış Yap
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes Wrapped in Layout */}
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExpensesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:projectId/statements/:statementId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StatementEditorPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/network"
              element={
                <ProtectedRoute>
                  <Layout>
                    <NetworkPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/partners"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PartnersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/partners/:partnerId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PartnerDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/expenses" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
