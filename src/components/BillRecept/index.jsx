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

export const BillReceipt = ({ data, previewMode = false }) => {
  if (!data) return null;

  const {
    stockPlace,
    paddyType,
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

  return (
    <Wrapper {...wrapperProps}>
      {/* Header */}
      <BillRow className="subEntry">
        <span> {stockPlace} - {paddyType}</span>
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
          </BillRow>
        ))}
      {entries.length > 1 && <Separator />}

      {/* 2. Total Weight & Bags */}
      <BillRow>
        <span>
          {formatNum(totalWeight)} - {totalBags} ಚೀಲ
        </span>
      </BillRow>
      {/* 3. Tare Calculation */}
      <BillRow>
        <span>
          {formatNum(tareWeight)} - ಪೆಚ್ಚು ({totalBags} * {tarePerBag})
        </span>
      </BillRow>
      <Separator />
      {/* 4. Net Weight & Rate */}
      <BillRow>
        <span>
          {parseFloat(netWeight).toFixed(2)} * {rate} ದರ
        </span>
      </BillRow>
      <Separator />
      {/* 5. Gross Amount */}
      <BillRow className="total">
        <span>{formatNum(grossAmount)}</span>
      </BillRow>
      {/* 6. Labour Charge */}
      <BillRow>
        <span>
          {formatNum(totalLabour)} - ಹಮಾಲಿ ({totalBags} * {labourCharge})
        </span>
      </BillRow>

      {/* 7. Net After Labour */}
      {adjustments.length > 0 && (
        <>
          <Separator />
          <BillRow>
            <span>{formatNum(netAfterLabour)}</span>
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
            {/* Show running total after adjustment if needed, or just list them. 
                Based on your example, you subtract line by line. 
            */}
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
      
      {/* Footer with Final Notes on same line */}
      <BillRow>
        <span style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          width: '100%',
          alignItems: 'center'
        }}>
          <span>0000000</span>
          {finalNotes && (
            <span style={{
              fontWeight: "bold",
              textAlign: "right",
            }}>
              {finalNotes}
            </span>
          )}
        </span>
      </BillRow>
    </Wrapper>
  );
};
