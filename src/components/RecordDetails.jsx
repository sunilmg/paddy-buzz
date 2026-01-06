import React from 'react';
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
    // We must ensure all calculated fields exist, even for old records
    let billData = {
        ...record, 
        ...data, 
    };

    // Fallback Calculations for OLD records that miss these fields
    if (!billData.grossAmount || !billData.totalLabour) {
        const entries = data.entries || [];
        const totWeight = entries.reduce((acc, curr) => acc + (Number(curr.weight)||0), 0);
        const totBags = entries.reduce((acc, curr) => acc + (Number(curr.bags)||0), 0);
        
        const tPerBag = Number(data.tarePerBag) || 2;
        const calculatedTare = totBags * tPerBag;
        
        // If netWeight is missing or matches totalWeight (old behavior), recalculate
        // But if netWeight exists in DB, use it? safer to re-derive for display consistency if fields are missing
        const netWt = totWeight - calculatedTare;
        
        // Rate
        const rt = Number(data.rate) || 0;
        const gross = (netWt / 100) * rt;
        
        // Labour: data.labourCharge is likely Rate (e.g. 12)
        // If totalLabour is missing, calc it.
        const labRate = Number(data.labourCharge) || 0;
        const labourTot = totBags * labRate;
        
        const afterLab = gross - labourTot;

        billData = {
            ...billData,
            totalWeight: data.totalWeight || totWeight,
            totalBags: data.totalBags || totBags,
            tareWeight: data.tareWeight || calculatedTare,
            netWeight: data.netWeight || netWt, // Logic check: if db has netWeight, it might be gross in old records? safer to use derived if we are fixing display
            grossAmount: data.grossAmount || gross,
            totalLabour: data.totalLabour || labourTot,
            netAfterLabour: data.netAfterLabour || afterLab,
            finalAmount: record.finalAmount || afterLab // Fallback if final missing
        };
    }

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
