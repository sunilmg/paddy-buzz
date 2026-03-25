import React from "react";
import { BillQuadrant, BillRow, Separator, DoubleSeparator } from "./styles";
import { Box } from "@mui/material";

const formatNum = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0=00";
  const val = Number(num);
  const parts = val.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${integerPart}=${parts[1]}`;
};

const formatEntryDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  // Guard against invalid dates
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
};

export const BillReceipt = ({ data, previewMode = false }) => {
  if (!data) return null;

  const {
    stockPlace,
    paddyType,
    transactionType,
    customerName,
    date,
    entries, // Now using the full entries array
    totalWeight,
    totalBags,
    tareWeight,
    tarePerBag,
    netWeight,
    rate,
    grossAmount,
    labourCharge,
    totalLabour,
    netAfterLabour,
    adjustments,
    finalAmount,
    finalNotes,
  } = data;

  // Only show labour row if there is an actual labour charge value
  const hasLabour = Number(labourCharge) > 0 && Number(totalLabour) > 0;

  const Wrapper = previewMode ? Box : BillQuadrant;
  const wrapperProps = previewMode
    ? {
        sx: {
          p: 4,
          bgcolor: "#fff",
          height: "100%",
          fontFamily: "Courier New",
        },
      }
    : {};

  const formattedDate = new Date(date).toLocaleDateString("en-GB");

  // Label for header: show Sale or Purchase if it's a sale
  const typeLabel = transactionType === "sale" ? "SALE" : null;

  return (
    <Wrapper {...wrapperProps}>
      {/* Header */}
      <BillRow className="subEntry">
        <span>
          {stockPlace} - {paddyType}
          {typeLabel && (
            <span style={{ marginLeft: 8, fontWeight: "bold", textTransform: "uppercase" }}>
              [{typeLabel}]
            </span>
          )}
        </span>
      </BillRow>
      <BillRow className="header">
        <span>{customerName}</span>
        <span>{formattedDate}</span>
      </BillRow>
      {/* 1. Individual Entries */}
      {entries.length > 1 &&
        entries.map((entry, idx) => (
          <BillRow key={idx} className="sub-entry">
            <span>
              {entry.weight} - {entry.bags} ಚೀಲ
            </span>
            {entry.date && (
              <span style={{ marginLeft: 8, fontSize: "0.85em", opacity: 0.75 }}>
                {formatEntryDate(entry.date)}
              </span>
            )}
          </BillRow>
        ))}
      {entries.length > 1 && <Separator />}

      {/* 2. Total Weight & Bags */}
      <BillRow className="subEntry">
        <span>
          {formatNum(totalWeight)} - {totalBags} ಚೀಲ
        </span>
      </BillRow>
      {/* 3. Tare Calculation */}
      <BillRow className="subEntry">
        <span>
          {formatNum(tareWeight)} - ಪೆಚ್ಚು ({totalBags} * {tarePerBag})
        </span>
      </BillRow>
      <Separator />
      {/* 4. Net Weight & Rate */}
      <BillRow className="subEntry">
        <span>
          {parseFloat(netWeight).toFixed(2)} * {rate} ದರ
        </span>
      </BillRow>
      <Separator />
      {/* 5. Gross Amount */}
      <BillRow className="total">
        <span>{formatNum(grossAmount)}</span>
      </BillRow>
      {/* 6. Labour Charge — only shown if there is a labour charge */}
      {hasLabour && (
        <BillRow className="subEntry">
          <span>
            {formatNum(totalLabour)} - ಹಮಾಲಿ ({totalBags} * {labourCharge})
          </span>
        </BillRow>
      )}

      {/* 7. Net After Labour */}
      {adjustments.length > 0 && (
        <>
          <Separator />
          <BillRow>
            <span>{formatNum(hasLabour ? netAfterLabour : grossAmount)}</span>
          </BillRow>
        </>
      )}

      {/* 8. Adjustments (Line by Line) */}
      {adjustments &&
        adjustments.map((adj, index) => (
          <React.Fragment key={index}>
            <BillRow>
              <span>
                {/* Show raw amount */}
                {formatNum(adj.amount)} {adj.type === "sub" ? "" : "(+)"}
              </span>
              <span
                style={{
                  textAlign: "right",
                  flex: 1,
                  marginLeft: "10px",
                }}
              >
                {adj.note || (adj.type === "sub" ? "Paid by Cash" : "Added")}
              </span>
            </BillRow>
          </React.Fragment>
        ))}
      <Separator />
      {/* 9. Final Totals */}
      <BillRow className="total">
        <span>{formatNum(finalAmount)}</span>
      </BillRow>
      <BillRow className="total">
        <span>{formatNum(finalAmount)}</span>
      </BillRow>
      <DoubleSeparator />
      
      {/* Footer */}
      <BillRow>
        <span>0000000</span>
      </BillRow>
      
      {/* Final Notes - Right aligned, can wrap to multiple lines */}
      {finalNotes && (
        <BillRow>
          <span
            style={{
              display: "block",
              textAlign: "right",
              fontWeight: "bold",
              width: "100%",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
              fontSize: "0.9em",
            }}
          >
            {finalNotes}
          </span>
        </BillRow>
      )}
    </Wrapper>
  );
};
