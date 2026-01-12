import React, { useEffect, useState, useRef } from 'react';
import { Container, Grid, Paper, Typography, Box, Card, CardContent, Divider, CircularProgress, TextField, MenuItem, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, TableContainer, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getRecords } from '../api/recordApi';
import { Navbar } from '../components/Navbar';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useReactToPrint } from 'react-to-print';
import { StockReportTemplate } from '../components/StockReportTemplate';

const StatCard = ({ title, value, subtext, icon, color }) => (
  <Card sx={{ height: '100%', borderLeft: `6px solid ${color}`, boxShadow: 3 }}>
    <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
                <Typography color="textSecondary" gutterBottom variant="subtitle2" textTransform="uppercase" fontWeight="bold">
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ color: color }}>
                    {value}
                </Typography>
                {subtext && <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>{subtext}</Typography>}
            </Box>
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}20` }}>
                {icon}
            </Box>
        </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    
    // Filter States
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Market Rates grouped by Type
    const [marketRates, setMarketRates] = useState({
        "Shree Ram": "",
        "RNR": "",
        "Other": ""
    });
    
    // Dashboard Filters
    const [stockPlaceFilter, setStockPlaceFilter] = useState('All');
    const [paddyTypeFilter, setPaddyTypeFilter] = useState('All');

    const [stats, setStats] = useState({
        totalStats: { bags: 0, weight: 0, revenue: 0, paid: 0, profit: 0 },
        stockPlaceData: [], // For charts
        tableData: []       // For detailed table
    });

    // Report Printing
    const reportPrintRef = useRef(null);
    const [reportConfigOpen, setReportConfigOpen] = useState(false);
    const [extraDeductionPerBag, setExtraDeductionPerBag] = useState(0); 
    const [reportData, setReportData] = useState({
        stockPlace: '',
        records: [],
        totals: { totalBags: 0, totalWeight: 0, totalAmount: 0, avgWeightPerBag: 0, netWeightAfterTare: 0, finalAmountAfterDeductions: 0 },
        deductions: { perBagCharge: 0, totalDeduction: 0, tareDeduction: 0 }
    });

    const handlePrintReportTrigger = useReactToPrint({
        contentRef: reportPrintRef,
        documentTitle: `Stock_Report_${reportData.stockPlace}`,
    });

    const handleOpenReportConfig = () => {
        if (stockPlaceFilter === 'All') {
            alert("Please select a specific Stock Place (Mill or Godan) to print a report.");
            return;
        }
        setReportConfigOpen(true);
    };

    const handlePrintReportResolved = () => {
        setReportConfigOpen(false);

        // Filter and Process records with specific calculation logic
        const reportRecords = records
            .filter(r => {
                const placeMatch = stockPlaceFilter === 'All' || r.data?.stockPlace === stockPlaceFilter;
                const typeMatch = paddyTypeFilter === 'All' || r.data?.paddyType === paddyTypeFilter;
                return placeMatch && typeMatch;
            })
            .map(r => {
                const bags = Number(r.data?.totalBags) || 0;
                const rate = Number(r.data?.rate) || 0;
                
                // Determine Total Labour Cost
                // Use stored 'totalLabour' if available. 
                // Fallback: use 'labourCharge' (which is usually rate/bag) * bags.
                const labourRatePerBag = Number(r.data?.labourCharge) || 12;
                let totalLabourCost;
                if (r.data?.totalLabour !== undefined) {
                    totalLabourCost = Number(r.data.totalLabour);
                } else {
                    totalLabourCost = bags * labourRatePerBag;
                }

                // Prefer stored values (Source of Truth), fallback to calc for older records
                // Stored 'netWeight' is After Tare. Stored 'totalWeight' is Gross.
                const storedTotalWeight = r.data?.totalWeight !== undefined ? Number(r.data.totalWeight) : undefined;
                const storedNetWeight = r.data?.netWeight !== undefined ? Number(r.data.netWeight) : undefined;
                const storedAmount = r.data?.netAfterLabour !== undefined ? Number(r.data.netAfterLabour) : undefined;

                // 1. Original/Gross Weight
                // If we have totalWeight, use it. Else if we have netWeight (and it's old record where maybe net=total?), use it. 
                // Actually safer to assume if totalWeight missing, we might need to derive it or fallback.
                // Let's assume: if totalWeight exists, use it. Else use netWeight as proxy for original (and we deduct tare).
                let originalWeight = storedTotalWeight;
                if (originalWeight === undefined) {
                     originalWeight = Number(r.data?.netWeight) || 0;
                }

                // 2. Tare Deduction & Net Weight
                // If we have stored Net Weight, use it directly.
                let netWeightForCalc = storedNetWeight;

                if (netWeightForCalc === undefined) {
                     // Fallback Calc - No default tare deduction if not explicitly stored
                     netWeightForCalc = originalWeight; // Assume netWeight is originalWeight if no tare is specified
                }

                // 3. Amount
                // If we have stored Amount (Net After Labour), use it.
                let finalRowAmount = storedAmount;
                
                if (finalRowAmount === undefined) {
                     // Fallback Calc
                     const calculatedAmount = (netWeightForCalc / 100) * rate;
                     finalRowAmount = calculatedAmount - totalLabourCost;
                }

                return {
                    customerName: r.customerName,
                    bags: bags,
                    originalWeight: originalWeight,
                    weight: netWeightForCalc, // Displaying the weight used for calculation
                    amount: finalRowAmount
                };
            });

        const totalBags = reportRecords.reduce((acc, curr) => acc + curr.bags, 0);
        const totalOriginalWeight = reportRecords.reduce((acc, curr) => acc + curr.originalWeight, 0);
        const totalAmount = reportRecords.reduce((acc, curr) => acc + curr.amount, 0);
        
        const avgWeight = totalBags > 0 ? (totalOriginalWeight / totalBags).toFixed(2) : 0;
        
        // Report Summary: Explicitly deduct 2kg tare per bag as requested
        const reportTareDeduction = totalBags * 2;
        const reportNetWeight = totalOriginalWeight - reportTareDeduction;

        // Extra Charge Deduction (from Dialog)
        const extraDeductionTotal = totalBags * extraDeductionPerBag;
        const finalAmountAfterDeductions = totalAmount - extraDeductionTotal;

        setReportData({
            stockPlace: `${stockPlaceFilter}${paddyTypeFilter !== 'All' ? ' - ' + paddyTypeFilter : ''}`,
            records: reportRecords,
            totals: {
                totalBags,
                totalWeight: totalOriginalWeight, // Show Gross in Summary top line
                totalAmount,
                avgWeightPerBag: avgWeight,
                netWeightAfterTare: reportNetWeight, // Using actual net from bills
                finalAmountAfterDeductions
            },
            deductions: {
                perBagCharge: extraDeductionPerBag,
                totalDeduction: extraDeductionTotal,
                tareDeduction: reportTareDeduction // 2kg per bag for report
            }
        });

        // Small delay to allow state update before printing
        setTimeout(() => {
            handlePrintReportTrigger();
        }, 100);
    };

    const fetchData = async () => {
        setLoading(true);
         try {
            const params = { limit: 5000, type: 'paddy' };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (paddyTypeFilter !== 'All') params.paddyType = paddyTypeFilter;
            if (stockPlaceFilter !== 'All') params.stockPlace = stockPlaceFilter;
            
            const res = await getRecords(params);
            setRecords(res.records || []);
         } catch (error) {
             console.error("Dashboard Error", error);
         } finally {
             setLoading(false);
         }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    // Re-process when filters/rates/records change
    useEffect(() => {
        if (!records.length) return;

        // Grouping Data
        // Key: StockPlace -> SubKey: PaddyType
        const grouped = {};
        let grandTotal = { bags: 0, weight: 0, revenue: 0, paid: 0, profit: 0 };

        records.forEach(rec => {
             const place = rec.data?.stockPlace || "Unknown";
             const recType = rec.data?.paddyType || "Unknown";
             
             // Client-side Filter
             if (stockPlaceFilter !== 'All' && place !== stockPlaceFilter) return;
             if (paddyTypeFilter !== 'All' && recType !== paddyTypeFilter) return;

            const type = rec.data?.paddyType || "Unknown";
            const bags = Number(rec.data?.totalBags) || 0;
            const weight = Number(rec.data?.netWeight) || 0;
            const revenue = Number(rec.finalAmount) || 0; // Payable
            const paid = Number(rec.data?.paidAmount) || 0;
            const purchaseRate = Number(rec.data?.rate) || 0;
            
            // Calculate Profit if market rate available for this type
            let profit = 0;
            const mRate = Number(marketRates[type]);
            if (mRate > 0) {
                 const diff = mRate - purchaseRate; 
                 const weightInQuintals = weight / 100;
                 profit = weightInQuintals * diff;
            }

            // Init Place
            if (!grouped[place]) grouped[place] = {};
            // Init Type within Place
            if (!grouped[place][type]) {
                grouped[place][type] = { bags: 0, weight: 0, revenue: 0, paid: 0, profit: 0, count: 0 };
            }

            // Aggregation
            const target = grouped[place][type];
            target.bags += bags;
            target.weight += weight;
            target.revenue += revenue;
            target.paid += paid;
            target.profit += profit;
            target.count += 1;

            grandTotal.bags += bags;
            grandTotal.weight += weight;
            grandTotal.revenue += revenue;
            grandTotal.paid += paid;
            grandTotal.profit += profit;
        });

        // Prepare Chart Data: Stock Place Groups
        // We want: [ { name: "Mill", ShreeRama_Bags: 100, RNR_Bags: 50 }, ... ]
        const chartData = Object.keys(grouped).map(place => {
            const placeData = { name: place };
            let placeTotalPaid = 0;
            let placeTotalRevenue = 0;
            
            Object.keys(grouped[place]).forEach(type => {
                placeData[`${type}_Bags`] = grouped[place][type].bags;
                placeTotalPaid += grouped[place][type].paid;
                placeTotalRevenue += grouped[place][type].revenue;
            });
             
            placeData.TotalPaid = placeTotalPaid;
            placeData.Remaining = placeTotalRevenue - placeTotalPaid;
            
            return placeData;
        });

        // Table Data Flattening
        const flatTable = [];
        Object.keys(grouped).forEach(place => {
            Object.keys(grouped[place]).forEach(type => {
                flatTable.push({
                    place,
                    type,
                    ...grouped[place][type]
                });
            });
        });

        setStats({
            totalStats: grandTotal,
            stockPlaceData: chartData,
            tableData: flatTable
        });

    }, [records, marketRates, stockPlaceFilter, paddyTypeFilter]); // Only depend on these

    const handleApplyFilters = () => {
        fetchData();
    };

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
            <Navbar />
            <Container maxWidth="xl">
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
                    <Typography variant="h4" fontWeight="bold">
                        Business Dashboard
                    </Typography>
                    
                    {/* Filters Bar */}
                    <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />

                        <TextField
                            select
                            label="Stock Place"
                            size="small"
                            value={stockPlaceFilter}
                            onChange={(e) => setStockPlaceFilter(e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="All">All Places</MenuItem>
                            <MenuItem value="Mill">Mill</MenuItem>
                            <MenuItem value="Godan">Godan</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Paddy Type"
                            size="small"
                            value={paddyTypeFilter}
                            onChange={(e) => setPaddyTypeFilter(e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="All">All Types</MenuItem>
                            <MenuItem value="Shree Ram">Shree Ram</MenuItem>
                            <MenuItem value="RNR">RNR</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                        </TextField>

                        <Button 
                            variant="outlined" 
                            color="secondary" 
                            disabled={stockPlaceFilter === 'All'}
                            onClick={handleOpenReportConfig}
                            startIcon={<InventoryIcon />}
                        >
                            Print Report
                        </Button>
                        
                        <Divider orientation="vertical" flexItem />
                        {/* Market Rates */}
                        <Typography variant="subtitle2" color="primary">Market Rates (Per Qtl):</Typography>
                         <TextField
                            label="Shree Ram Rate"
                            type="number"
                            size="small"
                            value={marketRates["Shree Ram"]}
                            onChange={(e) => setMarketRates({...marketRates, "Shree Ram": e.target.value})}
                            sx={{ width: 130 }}
                        />
                         <TextField
                            label="RNR Rate"
                            type="number"
                            size="small"
                            value={marketRates["RNR"]}
                            onChange={(e) => setMarketRates({...marketRates, "RNR": e.target.value})}
                            sx={{ width: 130 }}
                        />
                        <Button variant="contained" onClick={handleApplyFilters}>Refresh</Button>
                    </Paper>
                </Box>
                
                {/* Report Configuration Dialog */}
                <Dialog open={reportConfigOpen} onClose={() => setReportConfigOpen(false)}>
                    <DialogTitle>Report Configuration</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" gutterBottom>
                                Deduction Preferences for Stock Report:
                            </Typography>
                             <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                * Summary will show 2kg per bag tare deduction.
                            </Typography>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Extra Deduction Amount (Per Bag)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={extraDeductionPerBag}
                                onChange={(e) => setExtraDeductionPerBag(Number(e.target.value))}
                                helperText="This amount will be multiplied by total bags and deducted from the final amount"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setReportConfigOpen(false)}>Cancel</Button>
                        <Button onClick={handlePrintReportResolved} variant="contained" color="primary">
                            Print Report
                        </Button>
                    </DialogActions>
                </Dialog>
                
                {/* Hidden Print Component */}
                <div style={{ display: 'none' }}>
                    <StockReportTemplate 
                        ref={reportPrintRef}
                        stockPlace={reportData.stockPlace}
                        records={reportData.records}
                        totals={reportData.totals}
                        deductions={reportData.deductions}
                    />
                </div>

                {loading && <Box display="flex" justifyContent="center" mb={2}><CircularProgress /></Box>}

                {/* Top Level Cards */}

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard 
                            title="Total Stock" 
                            value={`${stats.totalStats.bags.toLocaleString()} Bags`}
                            subtext={`${(stats.totalStats.weight/100).toFixed(2)} Quintals`}
                            icon={<InventoryIcon color="primary" />}
                            color="#1976d2"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                       <StatCard 
                            title="Payments Made" 
                            value={`₹${stats.totalStats.paid.toLocaleString()}`} 
                            subtext={`Total Revenue: ₹${stats.totalStats.revenue.toLocaleString()}`}
                            icon={<TrendingUpIcon color="success" />}
                            color="#2e7d32"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard 
                            title="Pending Amount" 
                            value={`₹${(stats.totalStats.revenue - stats.totalStats.paid).toLocaleString()}`} 
                            subtext="To be paid"
                            icon={<AttachMoneyIcon color="warning" />}
                            color="#ed6c02"
                        />
                    </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                        <StatCard 
                            title="Projected P/L" 
                            value={`₹${Math.round(stats.totalStats.profit).toLocaleString()}`} 
                            subtext="Based on Market Rates"
                            icon={<AttachMoneyIcon color={stats.totalStats.profit >= 0 ? "success" : "error"} />}
                            color={stats.totalStats.profit >= 0 ? "#2e7d32" : "#d32f2f"}
                        />
                    </Grid>
                </Grid>

                {/* Charts Area */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* Chart 1: Stock by Place & Type */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 450 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <WarehouseIcon color="primary" />
                                <Typography variant="h6" fontWeight="bold">Stock Distribution by Place</Typography>
                            </Box>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.stockPlaceData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis label={{ value: 'Bags', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Legend />
                                    <Bar dataKey="Shree Ram_Bags" name="Shree Ram" stackId="a" fill="#1976d2" />
                                    <Bar dataKey="RNR_Bags" name="RNR" stackId="a" fill="#0288d1" />
                                    <Bar dataKey="Other_Bags" name="Other" stackId="a" fill="#757575" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                    
                    {/* Chart 2: Paid vs Remaining by Place */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: 450 }}>
                             <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <AttachMoneyIcon color="warning" />
                                <Typography variant="h6" fontWeight="bold">Paid vs Remaining by Place</Typography>
                            </Box>
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.stockPlaceData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(val) => `₹${val/1000}k`} />
                                    <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="TotalPaid" name="Paid" fill="#4caf50" />
                                    <Bar dataKey="Remaining" name="Remaining" fill="#ff9800" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Detailed Table */}
                <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: 1, borderColor: 'divider' }}>
                         <Typography variant="h6" fontWeight="bold">Detailed Breakdown</Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Stock Place</TableCell>
                                    <TableCell>Paddy Type</TableCell>
                                    <TableCell align="right">Bags</TableCell>
                                    <TableCell align="right">Weight (Qtl)</TableCell>
                                    <TableCell align="right">Total Value</TableCell>
                                    <TableCell align="right">Paid</TableCell>
                                    <TableCell align="right">Remaining</TableCell>
                                    <TableCell align="right">Projected P/L</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.tableData.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{row.place}</TableCell>
                                        <TableCell>
                                            <Chip label={row.type} size="small" color={row.type === 'Shree Ram' ? 'primary' : 'info'} variant="outlined"/>
                                        </TableCell>
                                        <TableCell align="right">{row.bags.toLocaleString()}</TableCell>
                                        <TableCell align="right">{(row.weight/100).toLocaleString()}</TableCell>
                                        <TableCell align="right">₹{row.revenue.toLocaleString()}</TableCell>
                                        <TableCell align="right" sx={{ color: 'success.main' }}>₹{row.paid.toLocaleString()}</TableCell>
                                        <TableCell align="right" sx={{ color: 'warning.main' }}>₹{(row.revenue - row.paid).toLocaleString()}</TableCell>
                                        <TableCell align="right" sx={{ color: row.profit >= 0 ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
                                            ₹{Math.round(row.profit).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {stats.tableData.length === 0 && (
                                     <TableRow>
                                        <TableCell colSpan={8} align="center">No data found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

            </Container>
        </Box>
    );
};

export default DashboardPage;
