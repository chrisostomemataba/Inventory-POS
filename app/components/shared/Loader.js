// components/shared/Loader.js
'use client'
import { Box, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme as useNextTheme } from 'next-themes';

const LoaderWrapper = styled(Box)(({ theme }) => ({
  '.card': {
    backgroundColor: theme.palette.background.paper,
    padding: '1rem 2rem',
    borderRadius: '1.25rem',
    boxShadow: theme.shadows[4],
  },

  '.loader': {
    color: theme.palette.text.secondary,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    fontSize: '25px',
    boxSizing: 'content-box',
    height: '40px',
    padding: '10px 10px',
    display: 'flex',
    borderRadius: '8px',
  },

  '.words': {
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(
        ${theme.palette.background.paper} 10%,
        transparent 30%,
        transparent 70%,
        ${theme.palette.background.paper} 90%
      )`,
      zIndex: 20,
    }
  },

  '.word': {
    display: 'block',
    height: '100%',
    paddingLeft: '6px',
    color: theme.palette.primary.main,
    animation: 'spin_4991 4s infinite',
  },

  '@keyframes spin_4991': {
    '10%': {
      transform: 'translateY(-102%)',
    },
    '25%': {
      transform: 'translateY(-100%)',
    },
    '35%': {
      transform: 'translateY(-202%)',
    },
    '50%': {
      transform: 'translateY(-200%)',
    },
    '60%': {
      transform: 'translateY(-302%)',
    },
    '75%': {
      transform: 'translateY(-300%)',
    },
    '85%': {
      transform: 'translateY(-402%)',
    },
    '100%': {
      transform: 'translateY(-400%)',
    },
  },
}));

const Loader = ({ words = ['Loading', 'System', 'Components', 'Data', 'Loading'] }) => {
  const theme = useTheme();
  const { resolvedTheme } = useNextTheme();

  return (
    <LoaderWrapper>
      <div className="card">
        <div className="loader">
          <p>loading</p>
          <div className="words">
            {words.map((word, index) => (
              <span key={index} className="word">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </LoaderWrapper>
  );
};

export default Loader;