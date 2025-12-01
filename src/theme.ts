import { createTheme, alpha } from '@mui/material/styles';

// Modern gradient ve renk paleti
const brandColors = {
      primary: {
            light: '#6366f1', // Indigo 500
            main: '#4f46e5', // Indigo 600
            dark: '#4338ca', // Indigo 700
      },
      secondary: {
            light: '#f97316', // Orange 500
            main: '#ea580c', // Orange 600
            dark: '#c2410c', // Orange 700
      },
      success: {
            light: '#22c55e', // Green 500
            main: '#16a34a', // Green 600
            dark: '#15803d', // Green 700
      },
      error: {
            light: '#ef4444', // Red 500
            main: '#dc2626', // Red 600
            dark: '#b91c1c', // Red 700
      },
      warning: {
            light: '#f59e0b', // Amber 500
            main: '#d97706', // Amber 600
            dark: '#b45309', // Amber 700
      },
      info: {
            light: '#06b6d4', // Cyan 500
            main: '#0891b2', // Cyan 600
            dark: '#0e7490', // Cyan 700
      }
};

export const getTheme = (mode: 'light' | 'dark') => {
      const isDark = mode === 'dark';
      const backgroundGradient = isDark
            ? `
                  radial-gradient(1200px 1200px at 15% 20%, rgba(99, 102, 241, 0.12), transparent),
                  radial-gradient(1000px 1000px at 85% 0%, rgba(14, 116, 144, 0.12), transparent),
                  radial-gradient(800px 800px at 50% 90%, rgba(34, 197, 94, 0.08), transparent),
                  #0a0f1f
            `
            : `
                  radial-gradient(1200px 1200px at 18% 18%, rgba(79, 70, 229, 0.08), transparent),
                  radial-gradient(1000px 1000px at 82% 0%, rgba(6, 182, 212, 0.08), transparent),
                  radial-gradient(800px 800px at 45% 95%, rgba(34, 197, 94, 0.06), transparent),
                  #f6f8fb
            `;
      const panelBackground = isDark
            ? `linear-gradient(145deg, rgba(15, 23, 42, 0.92) 0%, rgba(12, 19, 36, 0.88) 100%)`
            : `linear-gradient(145deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 247, 252, 0.9) 100%)`;
      const borderColor = isDark ? alpha('#94a3b8', 0.14) : alpha('#0f172a', 0.08);
      
      return createTheme({
            palette: {
                  mode,
                  primary: {
                        light: brandColors.primary.light,
                        main: isDark ? brandColors.primary.light : brandColors.primary.main,
                        dark: brandColors.primary.dark,
                        contrastText: '#ffffff',
                  },
                  secondary: {
                        light: brandColors.secondary.light,
                        main: brandColors.secondary.main,
                        dark: brandColors.secondary.dark,
                        contrastText: '#ffffff',
                  },
                  success: {
                        light: alpha(brandColors.success.light, 0.1),
                        main: brandColors.success.main,
                        dark: brandColors.success.dark,
                        contrastText: '#ffffff',
                  },
                  error: {
                        light: alpha(brandColors.error.light, 0.1),
                        main: brandColors.error.main,
                        dark: brandColors.error.dark,
                        contrastText: '#ffffff',
                  },
                  warning: {
                        light: alpha(brandColors.warning.light, 0.1),
                        main: brandColors.warning.main,
                        dark: brandColors.warning.dark,
                        contrastText: '#ffffff',
                  },
                  info: {
                        light: alpha(brandColors.info.light, 0.1),
                        main: brandColors.info.main,
                        dark: brandColors.info.dark,
                        contrastText: '#ffffff',
                  },
                  background: {
                        default: isDark ? '#0b1224' : '#f4f6fb',
                        paper: isDark ? alpha('#0f172a', 0.85) : '#ffffff',
                  },
                  text: {
                        primary: isDark ? '#f1f5f9' : '#0f172a', // Slate 100 : Slate 900 (daha koyu metin)
                        secondary: isDark ? '#94a3b8' : '#475569', // Slate 400 : Slate 600 (daha koyu secondary)
                  },
                  divider: isDark ? alpha('#94a3b8', 0.12) : alpha('#334155', 0.15),
            },
            typography: {
                  fontFamily: '"Sora", "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  h1: {
                        fontWeight: 800,
                        letterSpacing: '-0.025em',
                  },
                  h2: {
                        fontWeight: 700,
                        letterSpacing: '-0.025em',
                  },
                  h3: {
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                  },
                  h4: {
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                  },
                  h5: {
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                  },
                  h6: {
                        fontWeight: 600,
                        letterSpacing: '-0.01em',
                  },
                  subtitle1: {
                        fontWeight: 500,
                  },
                  subtitle2: {
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase' as const,
                        fontSize: '0.75rem',
                  },
                  body1: {
                        lineHeight: 1.7,
                  },
                  body2: {
                        lineHeight: 1.6,
                  },
                  button: {
                        textTransform: 'none' as const,
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                  },
            },
            shape: {
                  borderRadius: 16,
            },
            components: {
                  MuiCssBaseline: {
                        styleOverrides: {
                              body: {
                                    backgroundColor: isDark ? '#0b1224' : '#f6f8fb',
                                    backgroundImage: backgroundGradient,
                                    backgroundAttachment: 'fixed',
                                    color: isDark ? '#e2e8f0' : '#0f172a',
                                    scrollbarWidth: 'thin',
                                    '&::-webkit-scrollbar': {
                                          width: '8px',
                                          height: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                          background: isDark ? '#1e293b' : '#f1f5f9',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                          background: isDark ? '#475569' : '#cbd5e1',
                                          borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': {
                                          background: isDark ? '#64748b' : '#94a3b8',
                                    },
                              },
                        },
                  },
                  MuiButton: {
                        styleOverrides: {
                              root: {
                                    borderRadius: 12,
                                    padding: '10px 24px',
                                    fontSize: '0.9rem',
                                    boxShadow: 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                          boxShadow: isDark 
                                                ? '0 4px 20px rgba(99, 102, 241, 0.3)' 
                                                : '0 4px 20px rgba(79, 70, 229, 0.25)',
                                          transform: 'translateY(-1px)',
                                    },
                                    '&:active': {
                                          transform: 'translateY(0)',
                                    },
                              },
                              containedPrimary: {
                                    background: `linear-gradient(135deg, ${brandColors.primary.light} 0%, ${brandColors.primary.main} 100%)`,
                                    '&:hover': {
                                          background: `linear-gradient(135deg, ${brandColors.primary.main} 0%, ${brandColors.primary.dark} 100%)`,
                                    },
                              },
                              containedSecondary: {
                                    background: `linear-gradient(135deg, ${brandColors.secondary.light} 0%, ${brandColors.secondary.main} 100%)`,
                                    '&:hover': {
                                          background: `linear-gradient(135deg, ${brandColors.secondary.main} 0%, ${brandColors.secondary.dark} 100%)`,
                                    },
                              },
                              outlined: {
                                    borderWidth: '1.5px',
                                    '&:hover': {
                                          borderWidth: '1.5px',
                                          backgroundColor: isDark 
                                                ? alpha(brandColors.primary.light, 0.1) 
                                                : alpha(brandColors.primary.main, 0.05),
                                    },
                              },
                        },
                  },
                  MuiCard: {
                        styleOverrides: {
                              root: {
                                    borderRadius: 22,
                                    boxShadow: isDark 
                                          ? '0 20px 60px rgba(0, 0, 0, 0.45)' 
                                          : '0 20px 50px rgba(15, 23, 42, 0.08)',
                                    border: `1px solid ${borderColor}`,
                                    backgroundImage: panelBackground,
                                    backdropFilter: 'blur(12px)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                          boxShadow: isDark 
                                                ? '0 28px 72px rgba(0, 0, 0, 0.55)' 
                                                : '0 28px 72px rgba(15, 23, 42, 0.12)',
                                          transform: 'translateY(-3px)',
                                    },
                              },
                        },
                  },
                  MuiPaper: {
                        styleOverrides: {
                              root: {
                                    backgroundImage: panelBackground,
                                    border: `1px solid ${borderColor}`,
                                    backdropFilter: 'blur(12px)',
                              },
                              elevation1: {
                                    boxShadow: isDark 
                                          ? '0 12px 40px rgba(0, 0, 0, 0.35)' 
                                          : '0 12px 40px rgba(15, 23, 42, 0.06)',
                              },
                              elevation2: {
                                    boxShadow: isDark 
                                          ? '0 16px 48px rgba(0, 0, 0, 0.45)' 
                                          : '0 16px 48px rgba(15, 23, 42, 0.08)',
                              },
                              elevation3: {
                                    boxShadow: isDark 
                                          ? '0 24px 64px rgba(0, 0, 0, 0.5)' 
                                          : '0 24px 64px rgba(15, 23, 42, 0.12)',
                              },
                        },
                  },
                  MuiTextField: {
                        styleOverrides: {
                              root: {
                                    '& .MuiOutlinedInput-root': {
                                          borderRadius: 12,
                                          backgroundColor: isDark ? alpha('#0f172a', 0.5) : alpha('#f8fafc', 0.8),
                                          transition: 'all 0.2s ease',
                                          '& fieldset': {
                                                borderColor: isDark ? alpha('#94a3b8', 0.2) : alpha('#64748b', 0.2),
                                                borderWidth: '1.5px',
                                          },
                                          '&:hover fieldset': {
                                                borderColor: isDark ? alpha('#94a3b8', 0.4) : alpha('#64748b', 0.4),
                                          },
                                          '&.Mui-focused fieldset': {
                                                borderColor: brandColors.primary.main,
                                                borderWidth: '2px',
                                          },
                                          '&.Mui-focused': {
                                                backgroundColor: isDark ? alpha('#0f172a', 0.7) : '#ffffff',
                                                boxShadow: `0 0 0 4px ${alpha(brandColors.primary.main, 0.1)}`,
                                          },
                                    },
                                    '& .MuiInputLabel-root': {
                                          fontWeight: 500,
                                    },
                              },
                        },
                  },
                  MuiChip: {
                        styleOverrides: {
                              root: {
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    transition: 'all 0.2s ease',
                              },
                              filled: {
                                    '&:hover': {
                                          transform: 'scale(1.02)',
                                    },
                              },
                              outlined: {
                                    borderColor: isDark ? alpha('#94a3b8', 0.3) : alpha('#334155', 0.25),
                              },
                        },
                  },
                  MuiAppBar: {
                        styleOverrides: {
                              root: {
                                    backgroundColor: isDark 
                                          ? alpha('#0f172a', 0.8) 
                                          : alpha('#ffffff', 0.9),
                                    backdropFilter: 'blur(12px)',
                                    borderBottom: `1px solid ${isDark ? alpha('#94a3b8', 0.1) : alpha('#334155', 0.12)}`,
                                    boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                              },
                        },
                  },
                  MuiDialog: {
                        styleOverrides: {
                              paper: {
                                    borderRadius: 24,
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    boxShadow: isDark 
                                          ? '0 24px 48px rgba(0, 0, 0, 0.5)' 
                                          : '0 24px 48px rgba(0, 0, 0, 0.15)',
                              },
                        },
                  },
                  MuiMenu: {
                        styleOverrides: {
                              paper: {
                                    borderRadius: 16,
                                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                                    boxShadow: isDark 
                                          ? '0 12px 32px rgba(0, 0, 0, 0.4)' 
                                          : '0 12px 32px rgba(0, 0, 0, 0.12)',
                                    border: `1px solid ${isDark ? alpha('#94a3b8', 0.1) : alpha('#334155', 0.1)}`,
                              },
                        },
                  },
                  MuiTableCell: {
                        styleOverrides: {
                              root: {
                                    borderBottom: `1px solid ${isDark ? alpha('#94a3b8', 0.1) : alpha('#334155', 0.15)}`,
                              },
                              head: {
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    letterSpacing: '0.05em',
                                    color: isDark ? '#94a3b8' : '#334155',
                                    backgroundColor: isDark ? alpha('#0f172a', 0.5) : alpha('#e2e8f0', 0.6),
                              },
                        },
                  },
                  MuiTableRow: {
                        styleOverrides: {
                              root: {
                                    transition: 'background-color 0.2s ease',
                                    '&:hover': {
                                          backgroundColor: isDark 
                                                ? alpha('#94a3b8', 0.05) 
                                                : alpha('#64748b', 0.04),
                                    },
                              },
                        },
                  },
                  MuiAlert: {
                        styleOverrides: {
                              root: {
                                    borderRadius: 12,
                              },
                        },
                  },
                  MuiAvatar: {
                        styleOverrides: {
                              root: {
                                    background: `linear-gradient(135deg, ${brandColors.primary.light} 0%, ${brandColors.primary.main} 100%)`,
                              },
                        },
                  },
                  MuiTabs: {
                        styleOverrides: {
                              indicator: {
                                    height: 3,
                                    borderRadius: '3px 3px 0 0',
                              },
                        },
                  },
                  MuiTab: {
                        styleOverrides: {
                              root: {
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    minHeight: 48,
                              },
                        },
                  },
                  MuiIconButton: {
                        styleOverrides: {
                              root: {
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                          backgroundColor: isDark 
                                                ? alpha('#94a3b8', 0.1) 
                                                : alpha('#64748b', 0.08),
                                          transform: 'scale(1.05)',
                                    },
                              },
                        },
                  },
                  MuiToggleButton: {
                        styleOverrides: {
                              root: {
                                    borderRadius: 10,
                                    textTransform: 'none',
                                    fontWeight: 600,
                              },
                        },
                  },
                  MuiLinearProgress: {
                        styleOverrides: {
                              root: {
                                    borderRadius: 4,
                                    height: 6,
                              },
                        },
                  },
            },
      });
};

export default getTheme;
