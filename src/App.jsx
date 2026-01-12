import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import {
  Container,
  Grid,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  ThemeProvider,
  createTheme,
  Card,
  Tooltip,
  Stack,
  Alert,
  Tabs,
  Tab,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CssBaseline,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useReactToPrint } from "react-to-print";
import { PrintTemplate } from "./pages/billing/PrintTemplate";
import { BillReceipt } from "./components/BillRecept";
import { InterestReceipt } from "./components/InterestReceipt";
import RecordsPage from "./pages/RecordsPage";
import DashboardPage from "./pages/DashboardPage";
import { createRecord, updateRecord } from "./api/recordApi";
import { v4 as uuidv4 } from "uuid";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Avatar from "@mui/material/Avatar";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./components/SortableItem";
import { Navbar } from "./components/Navbar";
import { PrintQueueProvider, usePrintQueue } from "./context/PrintQueueContext";

const theme = createTheme({
  palette: {
    primary: { main: "#1b5e20" },
    secondary: { main: "#c62828" },
    background: { default: "#e8f5e9" },
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "input::-webkit-outer-spin-button, input::-webkit-inner-spin-button": {
          WebkitAppearance: "none",
          margin: 0,
        },
        "input[type=number]": {
          MozAppearance: "textfield",
        },
      },
    },
    MuiButton: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: "bold" } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
      },
    },
  },
});

function MainCalculator() {
  const navigate = useNavigate();
  const location = useLocation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Refs ---
  const printRef = useRef(null); // Reference for the Hidden Print Template

  // --- Form State ---
  const [customerName, setCustomerName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paddyEntries, setPaddyEntries] = useState([
    { id: uuidv4(), weight: "", bags: "" },
  ]);
  const [tarePerBag, setTarePerBag] = useState(2);
  const [rate, setRate] = useState("");
  const [labourCharge, setLabourCharge] = useState(12);
  const [adjustments, setAdjustments] = useState([]);
  const [stockPlace, setStockPlace] = useState("");
  const [paddyType, setPaddyType] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [finalNotes, setFinalNotes] = useState("");

  // --- Tab State ---
  const [tabValue, setTabValue] = useState(0);

  // --- Interest Form State ---
  const [intEntries, setIntEntries] = useState([]);

  // --- Queue State ---
  const { printQueue, addToPrintQueue, removeFromQueue: ctxRemoveFromQueue, clearQueue, updateQueue } = usePrintQueue();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // --- Edit Mode State ---
  const [currentRecordId, setCurrentRecordId] = useState(null);

  // --- Calculations ---
  const [calcs, setCalcs] = useState({
    totalWeight: 0,
    totalBags: 0,
    tareWeight: 0,
    netWeight: 0,
    grossAmount: 0,
    totalLabour: 0,
    netAfterLabour: 0,
    finalAmount: 0,
  });

  useEffect(() => {
    let totWeight = 0,
      totBags = 0;
    paddyEntries.forEach((entry) => {
      totWeight += Number(entry.weight) || 0;
      totBags += Number(entry.bags) || 0;
    });

    const calculatedTare = totBags * Number(tarePerBag);
    const netWt = totWeight - calculatedTare;
    const gross = (netWt / 100) * (Number(rate) || 0);
    const labourTotal = totBags * (Number(labourCharge) || 0);
    const afterLabour = gross - labourTotal;

    let final = afterLabour;
    adjustments.forEach((adj) => {
      if (adj.type === "add") final += Number(adj.amount) || 0;
      else final -= Number(adj.amount) || 0;
    });

    setCalcs({
      totalWeight: totWeight,
      totalBags: totBags,
      tareWeight: calculatedTare,
      netWeight: netWt,
      grossAmount: gross,
      totalLabour: labourTotal,
      netAfterLabour: afterLabour,
      finalAmount: final,
    });
  }, [paddyEntries, tarePerBag, rate, labourCharge, adjustments]);

  // --- Load Edit Data from Router State ---
  useEffect(() => {
    if (location.state && location.state.editRecord) {
      const record = location.state.editRecord;
      // Populate fields
      setCustomerName(record.customerName);
      setDate(new Date(record.date).toISOString().split("T")[0]);

      if (record.type === "interest") {
        setTabValue(1);
        setIntEntries(record.data.entries || []);
      } else {
        setTabValue(0);
        setStockPlace(record.data.stockPlace || "");
        setPaddyType(record.data.paddyType || "Shree Ram");
        setPaidAmount(record.data.paidAmount || "");
        setFinalNotes(record.data.finalNotes || "");
        setPaddyEntries(record.data.entries || []);
        setTarePerBag(record.data.tarePerBag || 2);
        setRate(record.data.rate || "");
        setLabourCharge(record.data.labourCharge || 12);
        setAdjustments(record.data.adjustments || []);
      }
      // Store ID for update
      setCurrentRecordId(record._id);
    }
  }, [location.state]);

  // --- Handlers ---
  const handleClearForm = () => {
    setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaddyEntries([{ id: uuidv4(), weight: "", bags: "" }]);
    setRate("");
    setAdjustments([]);
    setIntEntries([]);
    setCurrentRecordId(null);
    setStockPlace([]);
    setPaddyType("");
    setPaidAmount("");
    setFinalNotes("");
    // Clear router state so refresh doesn't reload edit
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleClearQueue = () =>
    clearQueue();

  const addToQueue = () => {
    if (!customerName || !rate) {
      alert("Please enter Customer Name and Rate");
      return;
    }

    if (!paddyType) {
        alert("Please select Paddy Type");
        return;
    }

    if (!stockPlace) {
        alert("Please select Stock Place");
        return;
    }

    const billData = {
      id: uuidv4(),
      customerName,
      stockPlace,
      paddyType,
      date,
      entries: [...paddyEntries],
      totalWeight: calcs.totalWeight,
      totalBags: calcs.totalBags,
      tareWeight: calcs.tareWeight,
      tarePerBag,
      netWeight: calcs.netWeight,
      rate,
      grossAmount: calcs.grossAmount,
      labourCharge,
      totalLabour: calcs.totalLabour,
      netAfterLabour: calcs.netAfterLabour,
      adjustments: [...adjustments],
      finalAmount: calcs.finalAmount,
      finalNotes,
    };

    const result = addToPrintQueue(billData);
    if (!result.success) {
      alert(result.message);
    }
  };

  const addInterestToQueue = () => {
    if (!customerName) {
      alert("Please enter Customer Name");
      return;
    }
    if (intEntries.length === 0) {
      alert("Please add at least one entry");
      return;
    }

    let final = 0;
    intEntries.forEach((adj) => {
      if (adj.type === "sum") return;
      const val = Number(adj.amount) || 0;
      if (adj.type === "add") final += val;
      else final -= val;
    });

    const billData = {
      id: uuidv4(),
      type: "interest",
      customerName,
      date,
      entries: [...intEntries],
      finalAmount: final,
    };

    const result = addToPrintQueue(billData);
    if (!result.success) {
      alert(result.message);
    }
  };

  const removeFromQueue = (e, index) => {
    e.stopPropagation();
    ctxRemoveFromQueue(index);
  };

  const handleEditQueueItem = (e, item) => {
    e.stopPropagation();
    setCustomerName(item.customerName || "");
    setDate(item.date || new Date().toISOString().split("T")[0]);

    if (item.type === "interest") {
      setTabValue(1);
      setIntEntries(item.entries || []);
    } else {
      setTabValue(0);
      setStockPlace(item.stockPlace || "");
      setPaddyType(item.paddyType || "Shree Ram");
      setPaidAmount(item.paidAmount || "");
      setFinalNotes(item.finalNotes || "");
      setPaddyEntries(item.entries || []);
      setTarePerBag(item.tarePerBag || 2);
      setRate(item.rate || "");
      setLabourCharge(item.labourCharge || 12);
      setAdjustments(item.adjustments || []);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
        const oldIndex = printQueue.findIndex(
          (item, index) => (item?.id ?? `empty-${index}`) === active.id
        );
        const newIndex = printQueue.findIndex(
          (item, index) => (item?.id ?? `empty-${index}`) === over.id
        );

        const newQ = arrayMove(printQueue, oldIndex, newIndex);
        updateQueue(newQ);
    }
  };

  const handleSaveToDB = async () => {
    if (!customerName) {
      setSnackbar({
        open: true,
        message: "Customer Name is required",
        severity: "error",
      });
      return;
    }

    let payload = {
      customerName,
      date,
    };

    if (tabValue === 1) {
      if (intEntries.length === 0) {
        setSnackbar({
          open: true,
          message: "Add at least one entry",
          severity: "error",
        });
        return;
      }
      let final = 0;
      intEntries.forEach((adj) => {
        if (adj.type === "sum") return;
        const val = Number(adj.amount) || 0;
        if (adj.type === "add") final += val;
        else final -= val;
      });

      payload.type = "interest";
      payload.finalAmount = final;
      payload.data = { entries: intEntries };
    } else {
      if (!rate) {
        setSnackbar({
          open: true,
          message: "Rate is required",
          severity: "error",
        });
        return;
      }
      if (!paddyType) {
        setSnackbar({
            open: true,
            message: "Paddy Type is required",
            severity: "error",
        });
        return;
      }
      payload.type = "paddy";
      payload.finalAmount = calcs.finalAmount;
      payload.data = {
        stockPlace,
        paddyType,
        paidAmount: paidAmount ? Number(paidAmount) : 0,
        rate,
        tarePerBag,
        labourCharge,
        totalWeight: calcs.totalWeight,
        totalBags: calcs.totalBags,
        tareWeight: calcs.tareWeight,
        netWeight: calcs.netWeight,
        grossAmount: calcs.grossAmount,
        totalLabour: calcs.totalLabour,
        netAfterLabour: calcs.netAfterLabour,
        entries: paddyEntries,
        adjustments: adjustments,
        finalNotes,
      };
    }

    try {
      if (currentRecordId) {
        if (!confirm("Are you sure you want to update this record?")) return;
        await updateRecord(currentRecordId, payload);
        setSnackbar({
          open: true,
          message: "Record Updated Successfully!",
          severity: "success",
        });
      } else {
        if (!confirm("Are you sure you want to save this new record?")) return;
        await createRecord(payload);
        setSnackbar({
          open: true,
          message: "Record Saved Successfully!",
          severity: "success",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error saving record: " + error.message,
        severity: "error",
      });
    }
  };

  // --- Printing Logic ---
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Paddy_Bill_${customerName || "Print"}`,
  });

  const handleSavePdf = async () => {
    const element = printRef.current;
    if (printQueue.every((item) => item === null)) {
      alert("Print Queue is empty! Please add a bill first.");
      return;
    }
    if (!element) return;

    const clonedElement = element.cloneNode(true);
    clonedElement.style.cssText = `
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      padding: 10mm !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-wrap: wrap !important;
      align-content: flex-start !important;
      background: white !important;
      visibility: visible !important;
      z-index: -9999 !important;
      opacity: 1 !important;
      pointer-events: none !important;
    `;

    document.body.appendChild(clonedElement);

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Bill_${customerName || "Print"}_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF generation failed.");
    } finally {
      if (document.body.contains(clonedElement)) {
        document.body.removeChild(clonedElement);
      }
    }
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
      <Navbar />

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* LEFT: INPUT */}
          <Grid item xs={12} lg={7}>
            <Paper sx={{ p: 3 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" color="primary" fontWeight="bold">
                  Bill Details
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleClearForm}
                  startIcon={<RestartAltIcon />}
                >
                  Reset Form
                </Button>
              </Box>

              <Grid container spacing={2}>
                  <Grid item xs={12} sm={3} minWidth={150}>
                    <FormControl fullWidth>
                    <InputLabel id="stock-place-label">Stock Place</InputLabel>
                    <Select
                        labelId="stock-place-label"
                        value={stockPlace}
                        label="Stock Place"
                        onChange={(e) => setStockPlace(e.target.value)}
                        required
                    >
                        <MenuItem value="Mill">Mill</MenuItem>
                        <MenuItem value="Godan">Godan</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>

                    </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={3} minWidth={150}>
                    <FormControl fullWidth>
                    <InputLabel id="paddy-type-label">Paddy Type</InputLabel>
                    <Select
                        labelId="paddy-type-label"
                        value={paddyType}
                        label="Paddy Type"
                        onChange={(e) => setPaddyType(e.target.value)}
                    >
                        <MenuItem value="Shree Ram">Shree Ram</MenuItem>
                        <MenuItem value="RNR">RNR</MenuItem>
                    </Select>
                    </FormControl>
                </Grid>
                {/* <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    variant="outlined"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Paid Amount"
                        type="number"
                        variant="outlined"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                    />
                </Grid> */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date"
                    InputLabelProps={{ shrink: true }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Grid>
              </Grid>

               <Grid container spacing={2} marginTop={2} marginBottom={2}>
                 <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    variant="outlined"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </Grid>
               
               </Grid>

              {/* Paddy Entries */}
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                  <Tab label="Paddy Calculation" />
                  <Tab label="Interest / Adjustments" />
                </Tabs>
              </Box>

              <div role="tabpanel" hidden={tabValue !== 0}>
                <Box>
                  <Box
                    sx={{
                      my: 3,
                      p: 2,
                      border: "1px solid #c8e6c9",
                      borderRadius: 2,
                      bgcolor: "#f1f8e9",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1, color: "primary.main", fontWeight: "bold" }}
                    >
                      PADDY ENTRIES
                    </Typography>
                    {paddyEntries.map((entry, index) => (
                      <Grid
                        container
                        spacing={2}
                        key={entry.id}
                        sx={{ mb: 1.5 }}
                      >
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            size="small"
                            label={`Weight (kg)`}
                            type="number"
                            value={entry.weight}
                            onChange={(e) => {
                              const list = [...paddyEntries];
                              list[index].weight = e.target.value;
                              setPaddyEntries(list);
                            }}
                          />
                        </Grid>
                        <Grid item xs={5}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Bags"
                            type="number"
                            value={entry.bags}
                            onChange={(e) => {
                              const list = [...paddyEntries];
                              list[index].bags = e.target.value;
                              setPaddyEntries(list);
                            }}
                          />
                        </Grid>
                        <Grid item xs={2} display="flex" alignItems="center">
                          <IconButton
                            color="error"
                            onClick={() => {
                              if (paddyEntries.length > 1)
                                setPaddyEntries(
                                  paddyEntries.filter((p) => p.id !== entry.id)
                                );
                            }}
                            disabled={paddyEntries.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    ))}
                    <Button
                      startIcon={<AddCircleIcon />}
                      size="small"
                      variant="text"
                      onClick={() =>
                        setPaddyEntries([
                          ...paddyEntries,
                          { id: uuidv4(), weight: "", bags: "" },
                        ])
                      }
                    >
                      Add Another Row
                    </Button>
                  </Box>

                  {/* Rates */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Tare/Bag (kg)"
                        type="number"
                        value={tarePerBag}
                        onChange={(e) => setTarePerBag(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Rate / Quintal"
                        type="number"
                        required
                        sx={{ input: { fontWeight: "bold" } }}
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Labour Charge"
                        type="number"
                        value={labourCharge}
                        onChange={(e) => setLabourCharge(e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  {/* Adjustments */}
                  <Divider sx={{ mb: 2 }} textAlign="left">
                    <Chip label="Adjustments / Cash" />
                  </Divider>
                  {adjustments.map((adj, index) => (
                    <Grid
                      container
                      spacing={1}
                      key={adj.id}
                      sx={{ mb: 1, alignItems: "center" }}
                    >
                      <Grid item xs={2}>
                        <Chip
                          label={adj.type === "add" ? "+" : "-"}
                          color={adj.type === "add" ? "success" : "warning"}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Amount"
                          type="number"
                          value={adj.amount}
                          onChange={(e) => {
                            const list = [...adjustments];
                            list[index].amount = e.target.value;
                            setAdjustments(list);
                          }}
                        />
                      </Grid>
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Note (e.g. Paid Cash)"
                          value={adj.note}
                          onChange={(e) => {
                            const list = [...adjustments];
                            list[index].note = e.target.value;
                            setAdjustments(list);
                          }}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setAdjustments(
                              adjustments.filter((a) => a.id !== adj.id)
                            )
                          }
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      onClick={() =>
                        setAdjustments([
                          ...adjustments,
                          { id: uuidv4(), type: "sub", amount: "", note: "" },
                        ])
                      }
                    >
                      - Deduct Cash
                    </Button>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      onClick={() =>
                        setAdjustments([
                          ...adjustments,
                          { id: uuidv4(), type: "add", amount: "", note: "" },
                        ])
                      }
                    >
                      + Add Charge
                    </Button>
                  </Stack>
                  <Divider sx={{ mb: 2, mt:4 }} textAlign="left" >
                    <Chip label="Cash Paid / Notes" />
                  </Divider>
                   <Grid container spacing={2} sx={{ mt: 3 }}>


                    
  <Grid item xs={12} sm={6} >
    <TextField
      fullWidth
      label="Paid Amount"
      type="number"
      variant="outlined"
      value={paidAmount}
      onChange={(e) => setPaidAmount(e.target.value)}
    />
  </Grid>
  <Grid item xs={12} >
    <TextField
      fullWidth
      label="Final Notes (Optional)"
      placeholder="Add any final notes or remarks..."
      variant="outlined"
      value={finalNotes}
      onChange={(e) => setFinalNotes(e.target.value)}
      sx={{
        width:"20rem",
        '& .MuiOutlinedInput-root': {
          bgcolor: '#f5f5f5',
        },
      }}
    />
  </Grid>
</Grid>

                  

                  {/* Live Totals */}
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 4,
                      p: 2,
                      bgcolor: "#263238",
                      color: "white",
                      borderRadius: 2,
                    }}
                  >
                    <Grid container alignItems="center">
                      {/* grid 1 */}
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          TOTAL WEIGHT: {calcs.totalWeight} kg
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          TOTAL BAGS: {calcs.totalBags}
                        </Typography>
                      </Grid>
                      {/* grid 2 */}
                      <Grid item xs={6} textAlign="right">
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          FINAL PAYABLE
                        </Typography>
                        <Typography
                          variant="h4"
                          fontWeight="bold"
                          sx={{ marginLeft: "30px" }}
                        >
                          ₹
                          {calcs.finalAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={addToQueue}
                      sx={{ flex: 1, height: 50 }}
                    >
                      Add to Queue
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveToDB}
                      sx={{ flex: 1, height: 50, bgcolor: "#2e7d32" }}
                    >
                      {currentRecordId ? "Update Record" : "Save Record"}
                    </Button>
                  </Stack>
                </Box>
              </div>

              <div role="tabpanel" hidden={tabValue !== 1}>
                {tabValue === 1 && (
                  <Box sx={{ p: 1 }}>
                    <Box
                      sx={{
                        my: 3,
                        p: 2,
                        border: "1px solid #ffcc80",
                        borderRadius: 2,
                        bgcolor: "#fff3e0",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          color: "secondary.main",
                          fontWeight: "bold",
                        }}
                      >
                        INTEREST / ENTRIES
                      </Typography>

                      {/* Entries List */}
                      {intEntries.map((entry, index) => (
                        <React.Fragment key={entry.id}>
                          {entry.type === "sum" ? (
                            <Box
                              sx={{
                                my: 2,
                                borderTop: "2px dashed #795548",
                                display: "flex",
                                justifyContent: "center",
                                position: "relative",
                              }}
                            >
                              <Chip
                                label="Calculation Point (Sum)"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: -12,
                                  bgcolor: "#fff3e0",
                                }}
                              />
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  setIntEntries(
                                    intEntries.filter((e) => e.id !== entry.id)
                                  )
                                }
                                sx={{
                                  position: "absolute",
                                  right: 0,
                                  top: -20,
                                }}
                              >
                                <RemoveCircleOutlineIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <Grid
                              container
                              spacing={1}
                              sx={{ mb: 1, alignItems: "center" }}
                            >
                              <Grid item xs={2}>
                                <Chip
                                  label={entry.type === "add" ? "+" : "-"}
                                  color={
                                    entry.type === "add" ? "success" : "warning"
                                  }
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  size="small"
                                  label="Amount"
                                  type="number"
                                  value={entry.amount}
                                  onChange={(e) => {
                                    const list = [...intEntries];
                                    list[index].amount = e.target.value;
                                    setIntEntries(list);
                                  }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={5}>
                                <TextField
                                  size="small"
                                  label="Note"
                                  value={entry.note}
                                  onChange={(e) => {
                                    const list = [...intEntries];
                                    list[index].note = e.target.value;
                                    setIntEntries(list);
                                  }}
                                  fullWidth
                                />
                              </Grid>
                              <Grid item xs={1}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setIntEntries(
                                      intEntries.filter(
                                        (e) => e.id !== entry.id
                                      )
                                    )
                                  }
                                >
                                  <RemoveCircleOutlineIcon />
                                </IconButton>
                              </Grid>
                            </Grid>
                          )}
                        </React.Fragment>
                      ))}

                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          onClick={() =>
                            setIntEntries([
                              ...intEntries,
                              {
                                id: uuidv4(),
                                type: "sub",
                                amount: "",
                                note: "",
                              },
                            ])
                          }
                        >
                          - Deduct
                        </Button>
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() =>
                            setIntEntries([
                              ...intEntries,
                              {
                                id: uuidv4(),
                                type: "add",
                                amount: "",
                                note: "",
                              },
                            ])
                          }
                        >
                          + Add
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          onClick={() =>
                            setIntEntries([
                              ...intEntries,
                              {
                                id: uuidv4(),
                                type: "sum",
                              },
                            ])
                          }
                        >
                          = Insert Sum
                        </Button>
                      </Stack>

                      {/* Live Total */}
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 4,
                          p: 2,
                          bgcolor: "#3e2723",
                          color: "white",
                          borderRadius: 2,
                        }}
                      >
                        <Grid container alignItems="center">
                          <Grid item xs={12} textAlign="right">
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              FINAL AMOUNT
                            </Typography>
                            <Typography
                              variant="h4"
                              fontWeight="bold"
                              sx={{ marginLeft: "30px" }}
                            >
                              ₹
                              {intEntries
                                .reduce((acc, curr) => {
                                  if (curr.type === "sum") return acc;
                                  return (
                                    acc +
                                    (curr.type === "add"
                                      ? Number(curr.amount) || 0
                                      : -(Number(curr.amount) || 0))
                                  );
                                }, 0)
                                .toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>

                      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          size="large"
                          fullWidth
                          onClick={addInterestToQueue}
                          sx={{ flex: 1, height: 50 }}
                        >
                          Add to Queue
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveToDB}
                          sx={{ flex: 1, height: 50, bgcolor: "#2e7d32" }}
                        >
                          {currentRecordId
                            ? "Update Interest"
                            : "Save Interest"}
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                )}
              </div>
            </Paper>
          </Grid>

          {/* RIGHT: QUEUE */}
          <Grid item xs={12} lg={5}>
            <Paper sx={{ p: 3, height: "100%", bgcolor: "#fff" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Print Queue (A4)</Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={handleClearQueue}
                  startIcon={<ClearAllIcon />}
                >
                  Clear All
                </Button>
              </Box>

              {/* Visualizer Grid */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={printQueue.map(
                    (item, index) => item?.id ?? `empty-${index}`
                  )}
                  strategy={rectSortingStrategy}
                >
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr", // Still 2 columns wide
                      gridTemplateRows: "repeat(3, 1fr)", // 3 rows tall for 6 items
                      gap: 2,
                      aspectRatio: "1 / 1.414", // Maintain A4 aspect ratio
                      bgcolor: "#eeeeee",
                      p: 2,
                      borderRadius: 2,
                    }}
                  >
                    {printQueue.map((item, index) => (
                      <SortableItem
                        key={item?.id ?? `empty-${index}`}
                        id={item?.id ?? `empty-${index}`}
                      >
                        <Card
                          onClick={() => {
                            if (item) {
                              setSelectedBill(item);
                              setModalOpen(true);
                            }
                          }}
                          sx={{
                            height: "100%", // Fill SortableItem
                            cursor: item ? "pointer" : "default",
                            bgcolor: item ? "#fff" : "#e0e0e0",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            border: item ? "2px solid #4caf50" : "none",
                          }}
                        >
                          {item ? (
                            <>
                              <Box sx={{ textAlign: "center" }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="bold"
                                >
                                  {item.customerName}
                                </Typography>
                                <Typography variant="body2" color="primary">
                                  ₹{Math.round(item.finalAmount)}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 0,
                                  right: 0,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => handleEditQueueItem(e, item)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => removeFromQueue(e, index)}
                                >
                                  <RemoveCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Empty
                            </Typography>
                          )}
                        </Card>
                      </SortableItem>
                    ))}
                  </Box>
                </SortableContext>
              </DndContext>

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleSavePdf}
                >
                  Save PDF
                </Button>
              </Stack>

              <Alert severity="info" sx={{ mt: 2, fontSize: "0.8rem" }}>
                Print works best on PC. For Mobile, use "Save PDF".
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Modal Preview */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Bill Preview</DialogTitle>
        <DialogContent dividers sx={{ bgcolor: "#f5f5f5", p: 2 }}>
          {selectedBill?.type === "interest" ? (
            <InterestReceipt data={selectedBill} previewMode={true} />
          ) : (
            <BillReceipt data={selectedBill} previewMode={true} />
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden Print Template */}

      <PrintTemplate ref={printRef} queue={printQueue} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function App() {
  useEffect(() => {
    const handleWheel = () => {
      // If the focused element is a number input, blur it to prevent scroll changes
      if (document.activeElement && document.activeElement.type === "number") {
        document.activeElement.blur();
      }
    };
    
    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <PrintQueueProvider>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
            <Route path="/" element={<MainCalculator />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
        </ThemeProvider>
    </PrintQueueProvider>
  );
}

export default App;
