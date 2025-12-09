import styled from "@emotion/styled";

export const BillQuadrant = styled.div`
  width: 50%;
  height: calc(100% / 3);
  padding: 15px 25px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  font-family: "Courier New", Courier, monospace;
  font-size: 13px;
  font-weight: 600;
  color: #000;
  line-height: 1.3;

  // Dashed lines for cutting guidance (optional)
  border-right: 1px dashed #e0e0e0;
  border-bottom: 1px dashed #e0e0e0;

  &:nth-of-type(2n) {
    border-right: none;
  }
  &:nth-of-type(n + 5) {
    border-bottom: none;
  }

  @media print {
    border: none; // Remove guidelines on actual print
  }
`;

export const BillRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
  align-items: center;

  &.header {
    font-weight: 800; /* Extra bold */
    font-size: 16px;
    margin-bottom: 8px;
    text-transform: uppercase;
    border-bottom: 2px solid #000;
    padding-bottom: 4px;
  }

  &.total {
    font-weight: 900;
    font-size: 17px;
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
