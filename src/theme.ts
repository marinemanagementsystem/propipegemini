import { createTheme } from '@mui/material/styles';

const theme = createTheme({
      palette: {
            primary: {
                  main: '#1a237e', // Koyu lacivert (Butonlar ve başlıklar için)
            },
            secondary: {
                  main: '#ff9800', // Turuncu (Vurgular için)
            },
            success: {
                  main: '#00e676', // Canlı yeşil (Ödendi durumu için)
                  light: '#b9f6ca',
                  contrastText: '#000',
            },
            warning: {
                  main: '#ffc107', // Sarı (Ödenmedi/Bekliyor durumu için)
                  light: '#fff9c4',
                  contrastText: '#000',
            },
            background: {
                  default: '#f5f7fa', // Çok açık gri arka plan
                  paper: '#ffffff',
            },
            text: {
                  primary: '#263238',
                  secondary: '#546e7a',
            },
      },
      typography: {
            fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            h4: {
                  fontWeight: 700,
                  color: '#263238',
            },
            h5: {
                  fontWeight: 600,
            },
            h6: {
                  fontWeight: 600,
            },
            button: {
                  textTransform: 'none', // Buton metinlerini büyük harf yapma
                  fontWeight: 600,
            },
      },
      shape: {
            borderRadius: 12, // Daha yuvarlak köşeler
      },
      components: {
            MuiButton: {
                  styleOverrides: {
                        root: {
                              borderRadius: 8,
                              padding: '10px 24px',
                              boxShadow: 'none',
                              '&:hover': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              },
                        },
                        containedPrimary: {
                              backgroundColor: '#1a237e',
                              color: '#fff',
                        },
                  },
            },
            MuiCard: {
                  styleOverrides: {
                        root: {
                              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                              border: '1px solid #e0e0e0',
                        },
                  },
            },
            MuiTextField: {
                  styleOverrides: {
                        root: {
                              '& .MuiOutlinedInput-root': {
                                    borderRadius: 8,
                                    backgroundColor: '#f8f9fa',
                                    '& fieldset': {
                                          borderColor: '#e0e0e0',
                                    },
                                    '&:hover fieldset': {
                                          borderColor: '#b0bec5',
                                    },
                                    '&.Mui-focused fieldset': {
                                          borderColor: '#1a237e',
                                    },
                              },
                        },
                  },
            },
            MuiChip: {
                  styleOverrides: {
                        root: {
                              fontWeight: 600,
                              borderRadius: 6,
                        },
                  },
            },
      },
});

export default theme;
