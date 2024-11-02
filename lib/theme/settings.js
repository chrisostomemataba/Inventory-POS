// lib/theme/settings.js
export const themeSettings = {
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      h1: {
        fontFamily: 'Playfair Display, serif',
        fontWeight: 700,
      },
      h2: {
        fontFamily: 'Playfair Display, serif',
        fontWeight: 700,
      },
      h3: {
        fontFamily: 'Playfair Display, serif',
        fontWeight: 600,
      },
      h4: {
        fontFamily: 'Playfair Display, serif',
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 24px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #7C3AED 0%, #9D65FF 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #6D31D4 0%, #8B55E3 100%)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.1)',
              },
              '&.Mui-focused': {
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.2)',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: 'all 0.2s ease-in-out',
          },
          elevation1: {
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
    },
  };
  