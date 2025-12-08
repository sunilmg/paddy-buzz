import styled from "@emotion/styled";

// export const PrintContainer = styled.div`
//   /* Default state: Hidden completely from the app UI */
//   display: none;

//   /* Print media query still useful if user uses Ctrl+P */
//   @media print {
//     display: flex;
//     position: relative;
//     z-index: 9999;
//     height: auto;
//     overflow: visible;
//     width: 210mm;
//     height: 297mm;
//   }
// `;

// src/styles.js

export const PrintContainer = styled.div`
  /* Hiding strategy 1: Hide completely by default */
  display: none;

  /* Hiding strategy 2 (For PDF/Testing): Absolute off-screen 
  position: absolute;
  top: -10000px;
  left: -10000px;
  opacity: 0;
  */

  /* CRITICAL: When printing, make it a visible, non-relative block */
  @media print {
    display: flex; /* Enables the flex grid */
    position: relative; /* Restores normal flow for printing */
    z-index: 9999;

    /* A4 Dimensions for 2x2 Quadrants */
    width: 210mm;
    height: 297mm;
    flex-wrap: wrap; /* Enables the 2x2 layout */
    align-content: flex-start;
    overflow: hidden;
  }
`;

export const BillQuadrant = styled.div`
  width: 50%;
  height: 50%; // Approx 148mm
  padding: 15px 25px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: "Courier New", Courier, monospace;
  font-size: 11px;
  color: #000;
  line-height: 1.3;

  // Dashed lines for cutting guidance (optional)
  border-right: 1px dashed #e0e0e0;
  border-bottom: 1px dashed #e0e0e0;

  &:nth-of-type(2n) {
    border-right: none;
  }
  &:nth-of-type(n + 3) {
    border-bottom: none;
  }

  /* @media print {
    width: 50%;
    height: 50%;
    border: none; // Remove guidelines on actual print
  } */
  @media print {
    width: 50%; /* Takes up exactly half the width */
    height: 50%; /* Takes up exactly half the height */
    border: none;
    box-sizing: border-box; /* Ensure padding/margin don't break 50% width/height */
    padding: 15px 25px; /* Use padding for inner margins */
  }
`;

export const BillRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
  align-items: center;

  &.header {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 8px;
    text-transform: uppercase;
    border-bottom: 1px solid #000;
    padding-bottom: 4px;
  }

  &.total {
    font-weight: 900;
    font-size: 15px;
    margin: 4px 0;
  }

  &.sub-entry {
    padding-left: 0px;
    color: #333;
  }
`;

export const Separator = styled.div`
  border-bottom: 1px solid #000;
  margin: 3px 0;
  width: 100%;
`;

export const DoubleSeparator = styled.div`
  border-bottom: 3px double #000;
  margin: 3px 0;
  width: 100%;
`;
