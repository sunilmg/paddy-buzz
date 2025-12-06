import React, { forwardRef } from "react";
import { PrintContainer } from "./styles";
import { BillReceipt } from "../../components/BillRecept";

// Must use forwardRef to allow react-to-print to grab the DOM element
export const PrintTemplate = forwardRef(({ queue }, ref) => {
  const slots = [0, 1, 2, 3];

  return (
    <PrintContainer ref={ref}>
      {slots.map((i) => (
        <React.Fragment key={i}>
          {queue[i] ? (
            <BillReceipt data={queue[i]} />
          ) : (
            // Empty placeholder
            <div style={{ width: "50%", height: "50%" }} />
          )}
        </React.Fragment>
      ))}
    </PrintContainer>
  );
});

// Display name for debugging
PrintTemplate.displayName = "PrintTemplate";
