// components/inventory/DeleteConfirmModal.js
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { 
  Warning as WarningIcon,
  Close as CloseIcon,
  DeleteForever as DeleteIcon 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeleteConfirmModal({ 
  open, 
  onClose, 
  onConfirm, 
  productName = 'this product' // Optional prop for product name
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={loading ? undefined : onClose}
          PaperComponent={motion.div}
          PaperProps={{
            initial: { opacity: 0, y: -20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 20 },
            transition: { duration: 0.2 }
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            m: 0, 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            bgcolor: 'error.main',
            color: 'error.contrastText'
          }}>
            <WarningIcon />
            Confirm Deletion
            {!loading && (
              <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: 'inherit'
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>

          <DialogContent sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning" sx={{ mt: 1 }}>
                This action cannot be undone.
              </Alert>
              
              <Typography variant="body1" sx={{ mt: 1 }}>
                Are you sure you want to delete <strong>{productName}</strong>?
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                This will:
                <ul>
                  <li>Remove the product from inventory</li>
                  <li>Archive all related transaction history</li>
                  <li>Update stock records accordingly</li>
                </ul>
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
            <Button
              onClick={onClose}
              disabled={loading}
              variant="outlined"
            >
              Cancel
            </Button>
            <LoadingButton
              loading={loading}
              onClick={handleConfirm}
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              loadingPosition="start"
            >
              Delete Product
            </LoadingButton>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
}