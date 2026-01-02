import React, { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useNavigate } from 'react-router-dom';
import { getRecords, deleteRecord, exportRecords, importRecords } from '../api/recordApi';
import { Navbar } from '../components/Navbar';

const RecordsPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('');

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
        type
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
  }, [page, type]); // Refresh on page or type change

  const handleSearch = () => {
    setPage(1);
    fetchRecords();
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
           <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="paddy">Paddy Bill</MenuItem>
              <MenuItem value="interest">Interest</MenuItem>
            </Select>
          </FormControl>
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
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount (₹)</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.type === 'paddy' ? 'Paddy' : 'Interest'} 
                    color={row.type === 'paddy' ? 'success' : 'warning'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {row.finalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleEdit(row)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDeleteClick(row._id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {records.length === 0 && !loading && (
               <TableRow>
                 <TableCell colSpan={5} align="center">No records found</TableCell>
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
      </Container>
    </Box>
  );
};

export default RecordsPage;
