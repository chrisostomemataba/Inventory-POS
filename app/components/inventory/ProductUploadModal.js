// app/components/inventory/ProductUploadModal.js
'use client'
import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Step,
  Stepper,
  StepLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { read, utils } from 'xlsx';

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
const REQUIRED_COLUMNS = ['name', 'quantity', 'unitPrice', 'category'];

export default function ProductUploadModal({ open, onClose, onUploadComplete }) {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState(0);

  const steps = ['Select File', 'Review Data', 'Upload'];

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const extension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setErrors(['Please upload an Excel or CSV file']);
      return;
    }

    setFile(selectedFile);
    await parseFile(selectedFile);
  };

  const parseFile = async (file) => {
    setLoading(true);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

      // Validate headers
      const headers = jsonData[0].map(header => header.toLowerCase().trim());
      const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

      if (missingColumns.length > 0) {
        setErrors([`Missing required columns: ${missingColumns.join(', ')}`]);
        setLoading(false);
        return;
      }

      // Transform data
      const transformedData = jsonData.slice(1).map(row => {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      });

      setParsedData(transformedData);
      setActiveStep(1);
    } catch (error) {
      setErrors(['Failed to parse file. Please check the format.']);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    setProgress(0);
    const total = parsedData.length;
    let processed = 0;
    const results = [];

    try {
      for (const product of parsedData) {
        try {
          const response = await fetch('/api/inventory/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product })
          });

          if (!response.ok) throw new Error('Failed to upload product');

          const result = await response.json();
          results.push({ ...product, success: true, result });
        } catch (error) {
          results.push({ ...product, success: false, error: error.message });
        }

        processed++;
        setProgress((processed / total) * 100);
      }

      setActiveStep(2);
      onUploadComplete?.(results);
    } catch (error) {
      setErrors(['Upload failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setParsedData([]);
      setErrors([]);
      setProgress(0);
      setActiveStep(0);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle>
        Upload Products
        {!loading && (
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        {loading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              Processing... {Math.round(progress)}%
            </Typography>
          </Box>
        )}

        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              id="file-upload"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                size="large"
                sx={{ mb: 2 }}
              >
                Select File
              </Button>
            </label>
            {file && (
              <Typography variant="body2" color="text.secondary">
                Selected file: {file.name}
              </Typography>
            )}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                File Requirements:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                - Excel or CSV format<br />
                - Required columns: name, quantity, unitPrice, category<br />
                - First row must be column headers
              </Typography>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">
                      ${parseFloat(row.unitPrice).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {parsedData.length > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">
                        {parsedData.length - 5} more items...
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upload Complete
            </Typography>
            <Typography color="text.secondary">
              Your products have been processed successfully.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {activeStep === 2 ? 'Close' : 'Cancel'}
        </Button>
        {activeStep === 1 && (
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={loading || parsedData.length === 0}
          >
            Upload {parsedData.length} Products
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}