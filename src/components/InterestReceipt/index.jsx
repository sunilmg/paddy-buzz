import React from "react";
import { Box } from "@mui/material";
// Reuse styles from BillRecept to maintain the "quadrant" look and feel
import { BillQuadrant, BillRow, Separator, DoubleSeparator } from "../BillRecept/styles";

const formatNum = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0=00";
  const val = Number(num);
  const parts = val.toFixed(2).split(".");
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${integerPart}=${parts[1]}`;
};

export const InterestReceipt = ({ data, previewMode = false }) => {
  if (!data) return null;

  const {
    customerName,
    date,
    entries, // Expecting array of { id, type: 'add'|'sub'|'sum', amount, note }
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

  // Pre-calculate totals for rendering
  const { entries: processedEntries } = (entries || []).reduce((acc, entry) => {
    if (entry.type === 'sum') {
        acc.entries.push({ ...entry, currentTotal: acc.total });
        return acc;
    }
    const val = Number(entry.amount) || 0;
    const isAdd = entry.type === 'add';
    const newTotal = isAdd ? acc.total + val : acc.total - val;
    acc.entries.push({ ...entry, val, isAdd });
    
    return { entries: acc.entries, total: newTotal };
  }, { entries: [], total: 0 });

  return (
    <Wrapper {...wrapperProps}>
       {/* Header */}
       <BillRow className="header">
        <span>{customerName}</span>
        <span>{formattedDate}</span>
      </BillRow>
      
      <BillRow className="subEntry">
        <span>Interest / Breakdown</span>
      </BillRow>
      
      <Separator />

      {/* Entries */}
      {processedEntries.map((entry, idx) => {
          if (entry.type === 'sum') {
              return (
                <React.Fragment key={idx}>
                    <Separator />
                    <BillRow style={{ fontWeight: 'bold' }}>
                        <span>{formatNum(entry.currentTotal)}</span>
                    </BillRow>
                </React.Fragment>
              )
          }

          return (
            <BillRow key={idx}>
              <span>
                 {entry.isAdd ? "+" : "-"} {formatNum(entry.val)}
              </span>
              <span style={{ textAlign: "right", flex: 1, marginLeft: "10px" }}>
                {entry.note}
              </span>
            </BillRow>
          );
      })}

      <DoubleSeparator />
      
    </Wrapper>
  );
};
