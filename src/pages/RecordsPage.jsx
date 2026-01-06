import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Typography,
  Box,
  Pagination,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useNavigate } from 'react-router-dom';
import { getRecords, deleteRecord, exportRecords, importRecords } from '../api/recordApi';
import { Navbar } from '../components/Navbar';
import { usePrintQueue } from '../context/PrintQueueContext';
import { v4 as uuidv4 } from 'uuid';
import { useReactToPrint } from "react-to-print";
import { PrintTemplate } from './billing/PrintTemplate';

import { RecordDetails } from '../components/RecordDetails';

const RecordsPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addToPrintQueue } = usePrintQueue();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState(null);
  
  // Details Modal
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState(null);

  const [directPrintQueue, setDirectPrintQueue] = useState([null, null, null, null, null, null]);
  const directPrintRef = useRef(null);
  
  // Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('paddy');
  const [tabValue, setTabValue] = useState(0);

  // Additional Filters
  const [paddyTypeFilter, setPaddyTypeFilter] = useState('All');
  const [stockPlaceFilter, setStockPlaceFilter] = useState('All');

  // Delete Confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getRecords({
        page,
        limit: 20,
        search,
        startDate,
        endDate,
        type,
        paddyType: paddyTypeFilter,
        stockPlace: stockPlaceFilter
      });
      setRecords(data.records);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, type, paddyTypeFilter, stockPlaceFilter]); // Refresh on filter change

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setType(newValue === 0 ? 'paddy' : 'interest');
    setPage(1);
    setPaddyTypeFilter('All');
    setStockPlaceFilter('All');
  };

  const handleSearch = () => {
    if (page === 1) {
        fetchRecords();
    } else {
        setPage(1);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteRecord(deleteId);
      setConfirmOpen(false);
      fetchRecords();
    } catch (error) {
      alert("Failed to delete record");
    }
  };

  const handleEdit = (record) => {
    // Navigate to Home with state to populate the form
    navigate('/', { state: { editRecord: record } });
  };

  const handleExport = async () => {
    try {
        const blob = await exportRecords({ startDate, endDate });
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `MRS-Paddy-data-${dateStr}.json`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    } catch(err) {
        console.error("Export failed", err);
        alert("Export failed");
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const json = JSON.parse(event.target.result);
            await importRecords(json);
            alert("Import Successful!");
            fetchRecords();
        } catch(err) {
             console.error("Import failed", err);
             alert("Import failed: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const prepareBillData = (record) => {
    let billData;
    const newId = uuidv4();
    const dateStr = new Date(record.date).toISOString().split('T')[0];

    if (record.type === 'interest') {
        billData = {
            id: newId,
            type: 'interest',
            customerName: record.customerName,
            date: dateStr,
            entries: record.data.entries || [],
            finalAmount: record.finalAmount
        };
    } else {
        // Safe access to data properties
        const rData = record.data || {};
        billData = {
            id: newId,
            customerName: record.customerName,
            stockPlace: rData.stockPlace,
            date: dateStr,
            entries: rData.entries || [],
            totalWeight: rData.totalWeight,
            totalBags: rData.totalBags,
            tareWeight: (rData.totalBags || 0) * (rData.tarePerBag || 0),
            tarePerBag: rData.tarePerBag,
            netWeight: rData.netWeight,
            rate: rData.rate,
            grossAmount: ((rData.netWeight || 0) / 100) * (rData.rate || 0),
            labourCharge: rData.labourCharge,
            totalLabour: (rData.totalBags || 0) * (rData.labourCharge || 0),
            netAfterLabour: 0, 
            adjustments: rData.adjustments || [],
            finalAmount: record.finalAmount
        };
    }
    return billData;
  };
  
  const handleRowClick = (record) => {
      setSelectedRecordForDetails(record);
      setDetailsDialogOpen(true);
  };

  const handlePrintClick = (record, e) => {
      e.stopPropagation(); // Prevent row click
      setSelectedForPrint(record);
      setPrintDialogOpen(true);
  };

  const handleConfirmAddToQueue = () => {
    if (!selectedForPrint) return;
    const billData = prepareBillData(selectedForPrint);
    
    const result = addToPrintQueue(billData);
    if (result.success) {
        setSnackbar({
            open: true,
            message: `Added to print queue. Remaining space: ${result.remaining}`,
            severity: 'success'
        });
    } else {
        setSnackbar({
            open: true,
            message: result.message,
            severity: 'warning'
        });
    }
    setPrintDialogOpen(false);
  };

  const handleDirectPrintTrigger = useReactToPrint({
    contentRef: directPrintRef,
    documentTitle: `Paddy_Bill_Direct_Print`,
  });

  const handleDirectPrint = async () => {
      if (!selectedForPrint) return;
      const billData = prepareBillData(selectedForPrint);
      // Place in the first slot for printing
      setDirectPrintQueue([billData, null, null, null, null, null]);
      
      // Wait a tick for state to update then print
      setTimeout(() => {
          handleDirectPrintTrigger();
          setPrintDialogOpen(false);
      }, 100);
  };



  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
      <Navbar />
      
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">
            Records History
          </Typography>
          <Box display="flex" gap={2}>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={handleExport}
              >
                Export JSON
              </Button>
              <Button 
                variant="contained" 
                startIcon={<UploadIcon />} 
                component="label"
              >
                Import JSON
                <input type="file" hidden accept=".json" onChange={handleImport} />
              </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="record-tabs">
            <Tab label="Paddy Records" />
            <Tab label="Interest Records" />
          </Tabs>
        </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search Customer"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <TextField
            label="From Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          
          {type === 'paddy' && (
              <>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Paddy Type</InputLabel>
                    <Select
                        value={paddyTypeFilter}
                        label="Paddy Type"
                        onChange={(e) => setPaddyTypeFilter(e.target.value)}
                    >
                        <MenuItem value="All">All Types</MenuItem>
                        <MenuItem value="Shree Ram">Shree Ram</MenuItem>
                        <MenuItem value="RNR">RNR</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Stock Place</InputLabel>
                    <Select
                        value={stockPlaceFilter}
                        label="Stock Place"
                        onChange={(e) => setStockPlaceFilter(e.target.value)}
                    >
                        <MenuItem value="All">All Places</MenuItem>
                        <MenuItem value="Mill">Mill</MenuItem>
                        <MenuItem value="Godan">Godan</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                    </Select>
                </FormControl>
              </>
          )}

          <Button variant="contained" onClick={handleSearch}>
            Filter
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#eee' }}>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Customer Name</TableCell>
              {type === 'paddy' ? (
                <>
                    <TableCell>Paddy Type</TableCell>
                    <TableCell>Stock Place</TableCell>
                    <TableCell align="center">Bags</TableCell>
                    <TableCell align="right">Paid (₹)</TableCell>
                </>
              ) : (
                <TableCell>Type</TableCell>
              )}
              <TableCell align="right">Payable (₹)</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((row) => (
              <TableRow 
                key={row._id} 
                hover 
                onClick={() => handleRowClick(row)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                {type === 'paddy' ? (
                  <>
                    <TableCell>{row.data?.paddyType || '-'}</TableCell>
                    <TableCell>{row.data?.stockPlace || '-'}</TableCell>
                    <TableCell align="center">{row.data?.totalBags || '-'}</TableCell>
                    <TableCell align="right">
                        {row.data?.paidAmount ? Number(row.data.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </TableCell>
                  </>
                ) : (
                    <TableCell>
                    <Chip 
                        label={row.type === 'paddy' ? 'Paddy' : 'Interest'} 
                        color={row.type === 'paddy' ? 'success' : 'warning'} 
                        size="small" 
                    />
                    </TableCell>
                )}

                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {row.finalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}> 
                  <IconButton color="primary" onClick={(e) => handlePrintClick(row, e)} title="Print Options">
                    <LocalPrintshopIcon />
                  </IconButton>
                  <IconButton color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteClick(row._id); }}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && !loading && (
               <TableRow>
                 <TableCell colSpan={7} align="center">No records found</TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Pagination 
          count={totalPages} 
          page={page} 
          onChange={(e, v) => setPage(v)} 
          color="primary" 
        />
      </Box>

      {/* Delete Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this record? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Details Dialog */}
       <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="lg" fullWidth>
            <DialogTitle>Record Details</DialogTitle>
            <DialogContent>
                <RecordDetails record={selectedRecordForDetails} />
            </DialogContent>
             <DialogActions>
                <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
                <Button variant="contained" onClick={() => { setDetailsDialogOpen(false); handlePrintClick(selectedRecordForDetails, { stopPropagation: () => {} }); }}>Print</Button>
            </DialogActions>
       </Dialog>

      {/* Print Options Dialog */}
      <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)}>
        <DialogTitle>Print Options</DialogTitle>
        <DialogContent>
            <Typography>
                Do you want to add this record to the print queue or print it directly?
            </Typography>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAddToQueue} variant="outlined" color="primary">
                Add to Queue
            </Button>
             <Button onClick={handleDirectPrint} variant="contained" color="success" startIcon={<LocalPrintshopIcon />}>
                Print Now
            </Button>
        </DialogActions>
      </Dialog>

      <div style={{ display: 'none' }}>
        <PrintTemplate ref={directPrintRef} queue={directPrintQueue} />
      </div>
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      </Container>
    </Box>
  );
};

export default RecordsPage;
