// components/shared/SnackbarProvider.js
'use client'
import { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const SnackbarContext = createContext({
  showSnackbar: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

export default function SnackbarProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success'); // success, error, warning, info
  const [duration, setDuration] = useState(6000);

  const showSnackbar = useCallback((message, severity = 'success', duration = 6000) => {
    setMessage(message);
    setSeverity(severity);
    setDuration(duration);
    setOpen(true);
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-message': {
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
          }}
        >
          <Typography variant="body2" component="span">
            {message}
          </Typography>
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
            sx={{ ml: 2 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}