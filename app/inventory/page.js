
// app/inventory/page.js
'use client'
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { 
  Box, 
  Button, 
  Typography, 
  Stack, 
  IconButton,
  TextField,
  Tooltip,
  Chip,
  Paper,
  InputAdornment,
  Menu,
  MenuItem,
  Divider,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ViewColumn as ColumnIcon,
} from '@mui/icons-material';
import ProductFormModal from '@/app/components/inventory/ProductFormModal';
import ProductUploadModal from '@/app/components/inventory/ProductUploadModal';
import DeleteConfirmModal from '@/app/components/inventory/DeleteConfirmModal';
import { useTheme } from 'next-themes';
import { useSnackbar } from '@/app/components/shared/SnackbarProvider';
import { format } from 'date-fns';

export default function InventoryPage() {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickFilterText, setQuickFilterText] = useState('');
  const { theme } = useTheme();
  const { showSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);

  // Custom Status Bar Component
const StatusBarComponent = (props) => {
  const [selectedCount, setSelectedCount] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (props.api) {
      const updateStats = () => {
        const selectedNodes = props.api.getSelectedNodes();
        const allRows = [];
        props.api.forEachNode(node => allRows.push(node));
        
        setSelectedCount(selectedNodes.length);
        setTotalProducts(allRows.length);
        
        const value = selectedNodes.reduce((sum, node) => {
          return sum + (node.data.quantity * node.data.unitPrice);
        }, 0);
        setTotalValue(value);
      };

      props.api.addEventListener('selectionChanged', updateStats);
      props.api.addEventListener('modelUpdated', updateStats);
      
      return () => {
        props.api.removeEventListener('selectionChanged', updateStats);
        props.api.removeEventListener('modelUpdated', updateStats);
      };
    }
  }, [props.api]);

  return (
    <Stack 
      direction="row" 
      spacing={3} 
      alignItems="center" 
      sx={{ 
        px: 2, 
        py: 1, 
        borderTop: 1, 
        borderColor: 'divider'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Total Products: {totalProducts}
      </Typography>
      <Divider orientation="vertical" flexItem />
      <Typography variant="body2" color="text.secondary">
        {selectedCount} selected
      </Typography>
      {selectedCount > 0 && (
        <>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2" color="text.secondary">
            Selected Value: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(totalValue)}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button 
            size="small" 
            onClick={() => props.api.deselectAll()}
            variant="outlined"
          >
            Clear Selection
          </Button>
        </>
      )}
    </Stack>
  );
};

// Also, add a simple Stock Status Renderer if not already defined
const StockStatusRenderer = (props) => {
  const value = props.value;
  const minStock = props.data.minimumQuantity;
  
  if (value <= 0) {
    return (
      <Chip
        icon={<ErrorIcon fontSize="small" />}
        label="Out of Stock"
        color="error"
        size="small"
        sx={{ minWidth: 100 }}
      />
    );
  } else if (value <= minStock) {
    return (
      <Chip
        icon={<WarningIcon fontSize="small" />}
        label="Low Stock"
        color="warning"
        size="small"
        sx={{ minWidth: 100 }}
      />
    );
  }
  return (
    <Chip
      icon={<CheckCircleIcon fontSize="small" />}
      label="In Stock"
      color="success"
      size="small"
      sx={{ minWidth: 100 }}
    />
  );
};

// And the Actions Renderer if not already defined
const ActionsRenderer = (props) => {
  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title="Edit Product">
        <IconButton
          size="small"
          onClick={() => props.onEdit(props.data)}
          sx={{ color: 'primary.main' }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="View History">
        <IconButton
          size="small"
          onClick={() => props.onHistory(props.data)}
          sx={{ color: 'info.main' }}
        >
          <HistoryIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Product">
        <IconButton
          size="small"
          onClick={() => props.onDelete(props.data)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

  // AG Grid Column Definitions
  const columnDefs = useMemo(() => [
    {
      headerName: 'Product Information',
      children: [
        {
          field: 'barcode',
          headerName: 'Barcode',
          filter: 'agTextColumnFilter',
          width: 140,
          pinned: 'left',
          filterParams: {
            filterOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
            defaultOption: 'contains'
          },
          cellStyle: { fontFamily: 'monospace' }
        },
        {
          field: 'name',
          headerName: 'Product Name',
          filter: 'agTextColumnFilter',
          minWidth: 220,
          flex: 2,
          cellRenderer: params => (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {params.value}
              </Typography>
              {!params.data.isActive && (
                <Chip 
                  label="Inactive" 
                  size="small" 
                  color="error" 
                  variant="outlined"
                  sx={{ height: 20 }}
                />
              )}
            </Stack>
          )
        }
      ]
    },
    {
      headerName: 'Category & Supply',
      children: [
        {
          field: 'category.name',
          headerName: 'Category',
          filter: 'agTextColumnFilter',
          minWidth: 150,
          flex: 1
        },
        {
          field: 'supplier.name',
          headerName: 'Supplier',
          filter: 'agTextColumnFilter',
          minWidth: 150,
          flex: 1
        }
      ]
    },
    {
      headerName: 'Stock Information',
      children: [
        {
          field: 'quantity',
          headerName: 'Stock Status',
          width: 150,
          cellRenderer: 'stockStatusRenderer',
          filter: false,
          cellStyle: { 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }
        },
        {
          field: 'quantity',
          headerName: 'Quantity',
          filter: 'agNumberColumnFilter',
          width: 120,
          type: 'numericColumn',
          valueFormatter: params => params.value.toLocaleString()
        }
      ]
    },
    {
      headerName: 'Pricing',
      children: [
        {
          field: 'unitPrice',
          headerName: 'Unit Price',
          filter: 'agNumberColumnFilter',
          width: 130,
          type: 'numericColumn',
          cellClass: 'font-tabular-nums',
          valueFormatter: params => 
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(params.value)
        },
        {
          field: 'costPrice',
          headerName: 'Cost Price',
          filter: 'agNumberColumnFilter',
          width: 130,
          type: 'numericColumn',
          cellClass: 'font-tabular-nums',
          valueFormatter: params => 
            new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(params.value)
        }
      ]
    },
    {
      headerName: 'Status & Actions',
      children: [
        {
          field: 'updatedAt',
          headerName: 'Last Updated',
          filter: 'agDateColumnFilter',
          width: 160,
          valueFormatter: params => 
            format(new Date(params.value), 'MMM dd, yyyy HH:mm'),
          filterParams: {
            comparator: (filterLocalDateAtMidnight, cellValue) => {
              const dateAsString = cellValue;
              const dateParts = dateAsString.split('/');
              const cellDate = new Date(
                Number(dateParts[2]),
                Number(dateParts[1]) - 1,
                Number(dateParts[0])
              );
              if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                return 0;
              }
              if (cellDate < filterLocalDateAtMidnight) {
                return -1;
              }
              if (cellDate > filterLocalDateAtMidnight) {
                return 1;
              }
            }
          }
        },
        {
          headerName: 'Actions',
          type: 'rightAligned',
          sortable: false,
          filter: false,
          width: 140,
          pinned: 'right',
          cellRenderer: 'actionsRenderer',
          cellRendererParams: {
            onEdit: (data) => {
              setSelectedProduct(data);
              setIsAddModalOpen(true);
            },
            onDelete: (data) => {
              setSelectedProduct(data);
              setIsDeleteModalOpen(true);
            },
            onHistory: (data) => {
              // Implement history view
            }
          }
        }
      ]
    }
  ], []);

  // Default Column Definition
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    suppressMenu: false,
    flex: 1,
    minWidth: 100,
    cellStyle: { fontSize: '13px' }
  }), []);

  // Grid Options with Status Bar
  const gridOptions = useMemo(() => ({
    rowSelection: 'multiple',
    rowMultiSelectWithClick: true,
    animateRows: true,
    pagination: true,
    paginationPageSize: 20,
    enableCellTextSelection: true,
    suppressRowClickSelection: true,
    statusBar: {
      statusPanels: [
        { statusPanel: 'statusBarComponent' },
        {
          statusPanel: 'agTotalRowCountComponent',
          align: 'left'
        },
        {
          statusPanel: 'agSelectedRowCountComponent',
          align: 'left'
        }
      ]
    },
    components: {
      statusBarComponent: StatusBarComponent,
      stockStatusRenderer: StockStatusRenderer,
      actionsRenderer: ActionsRenderer,
    },
    getRowStyle: params => {
      if (!params.data?.isActive) {
        return { opacity: '0.7', backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f5f5f5' };
      }
      return null;
    },
    getRowHeight: () => 52,
    rowClass: 'ag-row-hover-effect'
  }), [theme]);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setRowData(data);
    } catch (error) {
      showSnackbar('Failed to load inventory data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Grid Ready Handler
  const onGridReady = useCallback(() => {
    fetchData();
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    gridRef.current.api.exportDataAsCsv({
      fileName: `Inventory_${format(new Date(), 'yyyy-MM-dd')}`
    });
  }, []);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      p: { xs: 1, sm: 2, md: 3 },
      gap: 2
    }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          bgcolor: theme === 'dark' ? 'background.paper' : 'grey.50',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              fontWeight: 600,
              mb: 0.5,
              color: theme === 'dark' ? 'grey.100' : 'grey.900'
            }}
          >
            Inventory Management
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Manage your products, stock levels, and inventory transactions
          </Typography>
        </Box>

        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ minWidth: { sm: 400 } }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedProduct(null);
              setIsAddModalOpen(true);
            }}
            sx={{ 
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            Add Product
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
          >
            Export
          </Button>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: theme === 'dark' ? 'background.paper' : 'common.white'
        }}
      >
        {/* Search Bar */}
        <Box sx={{ 
          p: { xs: 2, md: 3 },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: theme === 'dark' ? 'background.paper' : 'grey.50'
        }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              placeholder="Search products..."
              size="small"
              fullWidth
              value={quickFilterText}
              onChange={(e) => {
                setQuickFilterText(e.target.value);
                gridRef.current.api.setQuickFilter(e.target.value);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: quickFilterText && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setQuickFilterText('');
                        gridRef.current.api.setQuickFilter('');
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                maxWidth: { sm: 300 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: theme === 'dark' ? 'background.paper' : 'common.white'
                }
              }}
            />
            <Box sx={{ flexGrow: 1 }} />
            <Stack direction="row" spacing={1}>
              <Tooltip title="Column Settings">
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ 
                    bgcolor: theme === 'dark' ? 'background.paper' : 'common.white'
                  }}
                >
                  <ColumnIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={fetchData}
                  sx={{ 
                    bgcolor: theme === 'dark' ? 'background.paper' : 'common.white'
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* AG Grid */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <div 
            className={`ag-theme-material${theme === 'dark' ? '-dark' : ''}`}
            style={{ height: '100%', width: '100%' }}
          >
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              quickFilterText={quickFilterText}
              enableCellTextSelection={true}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              suppressCellSelection={false}
              pagination={true}
              paginationPageSize={20}
              animateRows={true}
              domLayout="normal"
              overlayLoadingTemplate={
                '<span class="ag-overlay-loading-center">Loading inventory data...</span>'
              }
              overlayNoRowsTemplate={
                '<span class="ag-overlay-no-rows-center">No products found</span>'
              }
              rowClass="ag-row-hover"
              suppressMovableColumns={false}
              suppressColumnVirtualisation={true}
              enableRangeSelection={true}
              className={theme === 'dark' ? 'ag-theme-material-dark' : 'ag-theme-material'}
              getRowStyle={params => ({
                cursor: 'pointer',
                borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#f5f5f5'}`,
              })}
              onRowDoubleClicked={(params) => {
                setSelectedProduct(params.data);
                setIsAddModalOpen(true);
              }}
            />
          </div>
        </Box>
      </Paper>

      {/* Column Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            maxHeight: 300,
            width: 250,
            overflow: 'auto'
          }
        }}
      >
        <MenuItem 
          onClick={() => {
            gridRef.current.columnApi.resetColumnState();
            setAnchorEl(null);
          }}
        >
          Reset Columns
        </MenuItem>
        <MenuItem 
          onClick={() => {
            gridRef.current.columnApi.autoSizeAllColumns();
            setAnchorEl(null);
          }}
        >
          Auto-size All Columns
        </MenuItem>
        <Divider />
        {columnDefs.map((group) => (
          group.children?.map((col) => (
            <MenuItem
              key={col.field}
              onClick={() => {
                const isVisible = gridRef.current.columnApi.getColumn(col.field).isVisible();
                gridRef.current.columnApi.setColumnVisible(col.field, !isVisible);
              }}
            >
              <Checkbox
                checked={gridRef.current?.columnApi?.getColumn(col.field)?.isVisible() ?? true}
                size="small"
              />
              {col.headerName}
            </MenuItem>
          ))
        ))}
      </Menu>

      {/* Modals */}
      <ProductFormModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        product={selectedProduct}
        onSubmit={async (data) => {
          try {
            const response = await fetch(
              `/api/inventory${selectedProduct ? `/${selectedProduct.id}` : ''}`,
              {
                method: selectedProduct ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              }
            );
            
            if (!response.ok) throw new Error('Failed to save product');
            
            showSnackbar(
              `Product ${selectedProduct ? 'updated' : 'added'} successfully`,
              'success'
            );
            setIsAddModalOpen(false);
            fetchData();
          } catch (error) {
            showSnackbar(error.message, 'error');
          }
        }}
      />

      <ProductUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={(results) => {
          fetchData();
          setIsUploadModalOpen(false);
          showSnackbar(`Successfully processed ${results.length} products`, 'success');
        }}
      />

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          try {
            const response = await fetch(`/api/inventory/${selectedProduct.id}`, {
              method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete product');
            
            showSnackbar('Product deleted successfully', 'success');
            setIsDeleteModalOpen(false);
            fetchData();
          } catch (error) {
            showSnackbar(error.message, 'error');
          }
        }}
      />

      {/* Speed Dial for Mobile */}
      <SpeedDial
        ariaLabel="Product actions"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<AddIcon />}
          tooltipTitle="Add Product"
          onClick={() => {
            setSelectedProduct(null);
            setIsAddModalOpen(true);
          }}
        />
        <SpeedDialAction
          icon={<UploadIcon />}
          tooltipTitle="Import Products"
          onClick={() => setIsUploadModalOpen(true)}
        />
        <SpeedDialAction
          icon={<DownloadIcon />}
          tooltipTitle="Export Products"
          onClick={exportToCSV}
        />
      </SpeedDial>
 {/* Custom Styles */}
 <style jsx global>{`
        .ag-theme-material .ag-header-cell,
        .ag-theme-material-dark .ag-header-cell {
          font-size: 13px;
          font-weight: 600;
        }

        .ag-row-hover {
          transition: all 0.2s ease;
        }

        .ag-row-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .font-tabular-nums {
          font-feature-settings: "tnum";
          font-variant-numeric: tabular-nums;
        }

        .ag-overlay-loading-center,
        .ag-overlay-no-rows-center {
          padding: 24px;
          border-radius: 8px;
          background: ${theme === 'dark' ? '#2a2a2a' : '#fff'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>
     
    </Box>
  );
}