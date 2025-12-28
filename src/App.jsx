import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useReactToPrint } from "react-to-print";
import { PrintTemplate } from "./pages/billing/PrintTemplate";
import { BillReceipt } from "./components/BillRecept";
import { InterestReceipt } from "./components/InterestReceipt";
import { v4 as uuidv4 } from "uuid";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Avatar from "@mui/material/Avatar";

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

function App() {
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
  const [stockPlace, setStockPlace] = useState([]);
  
  // --- Tab State ---
  const [tabValue, setTabValue] = useState(0);

  // --- Interest Form State ---
  const [intEntries, setIntEntries] = useState([]);

  // --- Queue State ---
  const [printQueue, setPrintQueue] = useState([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

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

  // --- Handlers ---
  const handleClearForm = () => {
    setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setPaddyEntries([{ id: uuidv4(), weight: "", bags: "" }]);
    setRate("");
    setAdjustments([]);
    setIntEntries([]);
  };

  const handleClearQueue = () =>
    setPrintQueue([null, null, null, null, null, null]);

  const addToQueue = () => {
    if (!customerName || !rate) {
      alert("Please enter Customer Name and Rate");
      return;
    }
    const emptyIndex = printQueue.indexOf(null);
    if (emptyIndex === -1) {
      alert("Queue Full. Clear some items.");
      return;
    }

    const billData = {
      id: uuidv4(),
      customerName,
      stockPlace,
      date,
      entries: [...paddyEntries], // Store copy of entries
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
    };

    const newQueue = [...printQueue];
    newQueue[emptyIndex] = billData;
    setPrintQueue(newQueue);
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
    const emptyIndex = printQueue.indexOf(null);
    if (emptyIndex === -1) {
      alert("Queue Full. Clear some items.");
      return;
    }

    // Calculate final total just for metadata (optional)
    let final = 0;
    intEntries.forEach(adj => {
       if(adj.type === 'sum') return; 
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

    const newQueue = [...printQueue];
    newQueue[emptyIndex] = billData;
    setPrintQueue(newQueue);
  };

  const removeFromQueue = (e, index) => {
    e.stopPropagation();
    const newQueue = [...printQueue];
    newQueue[index] = null;
    setPrintQueue(newQueue);
  };

  // --- Printing Logic (Fix for Ref Error) ---
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Use contentRef instead of content for newer versions
    documentTitle: `Paddy_Bill_${customerName || "Print"}`,
  });

  const handleSavePdf = async () => {
    const element = printRef.current;
    if (printQueue.every((item) => item === null)) {
      alert("Print Queue is empty! Please add a bill first.");
      return;
    }

    if (!element) return;

    // 1. Clone the element
    const clonedElement = element.cloneNode(true);

    // 2. INVISIBLE STYLING:
    // - We keep it "visible" for the browser renderer
    // - But we put it BEHIND everything (z-index: -9999) so the user can't see it.
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
      
      /* CRITICAL FIXES FOR USER EXPERIENCE */
      visibility: visible !important; /* Needed for capture */
      z-index: -9999 !important;      /* Hides it behind your app background */
      opacity: 1 !important;          /* Needed for capture */
      pointer-events: none !important; /* Prevents interference with clicks */
    `;

    document.body.appendChild(clonedElement);

    try {
      // 3. Short wait to ensure DOM paints (invisible to user)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 4. Capture
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        scrollY: 0, // Ensure we capture from the top of the clone
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      // 5. Generate PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Bill_${customerName || "Print"}_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF generation failed.");
    } finally {
      // 6. Cleanup
      if (document.body.contains(clonedElement)) {
        document.body.removeChild(clonedElement);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 8 }}>
        {/* Header */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "white",
            py: 2,
            px: 3,
            mb: 4,
            boxShadow: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Typography variant="h5" fontWeight="bold">
              🌾 MRS Paddy Calculator{" "}
              <Typography variant="caption">Developed by - Sunil MG</Typography>
            </Typography>
          </div>

          <Button
            color="inherit"
            onClick={handleClearForm}
            startIcon={<RestartAltIcon />}
          >
            Reset Form
          </Button>
        </Box>

        <Container maxWidth="xl">
          <Grid container spacing={3}>
            {/* LEFT: INPUT */}
            <Grid item xs={12} lg={7}>
              <Paper sx={{ p: 3 }}>
                {/* Basic Info */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={18}>
                    <TextField
                      fullWidth
                      label="Stock Place"
                      variant="outlined"
                      value={stockPlace}
                      onChange={(e) => setStockPlace(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      variant="outlined"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
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
                    <Grid container spacing={2} key={entry.id} sx={{ mb: 1.5 }}>
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

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mt: 3, height: 50 }}
                  onClick={addToQueue}
                >
                  Add Bill to Queue
                </Button>
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
                              {entry.type === 'sum' ? (
                                <Box sx={{ my: 2, borderTop: "2px dashed #795548", display: 'flex', justifyContent: 'center', position: 'relative' }}>
                                   <Chip label="Calculation Point (Sum)" size="small" sx={{ position: 'absolute', top: -12, bgcolor: '#fff3e0' }} />
                                   <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        setIntEntries(
                                          intEntries.filter(
                                            (e) => e.id !== entry.id
                                          )
                                        )
                                      }
                                      sx={{ position: 'absolute', right: 0, top: -20 }}
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
                                <Typography
                                  variant="caption"
                                  sx={{ opacity: 0.7 }}
                                >
                                  FINAL AMOUNT
                                </Typography>
                                <Typography
                                  variant="h4"
                                  fontWeight="bold"
                                  sx={{ marginLeft: "30px" }}
                                >
                                  ₹
                                  {intEntries.reduce(
                                      (acc, curr) => {
                                        if (curr.type === 'sum') return acc;
                                        return acc +
                                        (curr.type === "add"
                                          ? Number(curr.amount) || 0
                                          : -(Number(curr.amount) || 0));
                                      },
                                      0
                                    )
                                  .toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>

                          <Button
                            variant="contained"
                            color="secondary"
                            size="large"
                            fullWidth
                            sx={{ mt: 3, height: 50 }}
                            onClick={addInterestToQueue}
                          >
                            Add Interest Note to Queue
                          </Button>
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
                    <Card
                      key={index}
                      onClick={() => {
                        if (item) {
                          setSelectedBill(item);
                          setModalOpen(true);
                        }
                      }}
                      sx={{
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
                            <Typography variant="subtitle2" fontWeight="bold">
                              {item.customerName}
                            </Typography>
                            <Typography variant="body2" color="primary">
                              ₹{Math.round(item.finalAmount)}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            sx={{ position: "absolute", top: 0, right: 0 }}
                            onClick={(e) => removeFromQueue(e, index)}
                          >
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          Empty
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Box>

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
      </Box>
    </ThemeProvider>
  );
}

export default App;
