// components/inventory/InventoryHistory.js
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';
import { format } from 'date-fns';

export default function InventoryHistory({ open, onClose, productId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      setLoading(true);
      fetch(`/api/inventory/${productId}/history`)
        .then(res => res.json())
        .then(data => {
          setHistory(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching history:', error);
          setLoading(false);
        });
    }
  }, [productId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Inventory History</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography>Loading history...</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity Change</TableCell>
                  <TableCell align="right">Previous Stock</TableCell>
                  <TableCell align="right">New Stock</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Updated By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.createdAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{record.transactionType}</TableCell>
                    <TableCell align="right">
                      {record.transactionType === 'IN' ? '+' : '-'}
                      {record.quantity}
                    </TableCell>
                    <TableCell align="right">{record.previousStock}</TableCell>
                    <TableCell align="right">{record.newStock}</TableCell>
                    <TableCell>{record.notes}</TableCell>
                    <TableCell>{record.user.fullName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}