import React, { useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Divider, 
  Paper, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { BillReceipt } from './BillRecept';
import { InterestReceipt } from './InterestReceipt';

export const RecordDetails = ({ record }) => {
    if (!record) return null;

    const isPaddy = record.type === 'paddy';
    const data = record.data || {};
    
    // Normalize data for BillReceipt
    const billData = {
        ...record, // id, type, finalAmount, etc
        ...data,   // stockPlace, paddyType, rates, etc
    };

    return (
        <Box>
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="overline" color="textSecondary">Record ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{record._id}</Typography>
                </Box>
                <Chip 
                    label={isPaddy ? "Paddy Bill" : "Interest Record"} 
                    color={isPaddy ? "success" : "warning"} 
                    variant="outlined" 
                />
            </Box>

            <Grid container spacing={3}>
                {/* Left Side: The Bill/Receipt View which is familiar */}
                <Grid item xs={12} md={7}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Receipt Preview
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fff' }}>
                        {isPaddy ? (
                            <BillReceipt data={billData} previewMode={true} />
                        ) : (
                            <InterestReceipt data={billData} previewMode={true} />
                        )}
                    </Paper>
                </Grid>

                {/* Right Side: Office/Internal Details */}
                <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Internal Record Details
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row">Customer</TableCell>
                                        <TableCell align="right">{record.customerName}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row">Date</TableCell>
                                        <TableCell align="right">{new Date(record.date).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                     <TableRow>
                                        <TableCell component="th" scope="row">Total Payable</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                            ₹{Number(record.finalAmount).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                    {isPaddy && (
                                        <>
                                            <TableRow>
                                                <TableCell component="th" scope="row">Paddy Type</TableCell>
                                                <TableCell align="right">{data.paddyType || '-'}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" scope="row">Stock Place</TableCell>
                                                <TableCell align="right">{data.stockPlace || '-'}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" scope="row">Total Bags</TableCell>
                                                <TableCell align="right">{data.totalBags}</TableCell>
                                            </TableRow>
                                             <TableRow>
                                                <TableCell component="th" scope="row">Net Weight</TableCell>
                                                <TableCell align="right">{data.netWeight} kg</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" scope="row">Purchase Rate</TableCell>
                                                <TableCell align="right">₹{data.rate}</TableCell>
                                            </TableRow>
                                            <TableRow sx={{ bgcolor: '#e8f5e9' }}>
                                                <TableCell component="th" scope="row" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                    Paid Amount
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                    ₹{Number(data.paidAmount || 0).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell component="th" scope="row">Pending Balance</TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main' }}>
                                                    ₹{((record.finalAmount || 0) - (data.paidAmount || 0)).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
