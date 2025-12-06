import { TextField, Typography } from "@mui/material";
import React from "react";
import {
  BillBodyContainer,
  BillContainer,
  BillHeader,
  BillMainContainer,
  BillSummaryContainer,
} from "./styles";

const index = () => {
  const getTodaysDate = () => {
    const dateObj = new Date();
    return `${dateObj.getDate()}/${dateObj.getMonth()}/${dateObj.getFullYear()}`;
  };
  return (
    <BillMainContainer>
      {/* header */}
      <BillHeader>
        <Typography variant="h5">MRS Paddy billing</Typography>
      </BillHeader>

      <BillBodyContainer>
        {/* content */}
        <BillContainer>
          <TextField
            id="customer-name-basic"
            label="Customer name"
            variant="outlined"
            size="small"
            sx={{ width: "20rem" }}
          />
          <TextField
            id="date-basic"
            label="Date"
            variant="outlined"
            size="small"
            defaultValue={getTodaysDate()}
            sx={{ width: "10rem" }}
          />
          <TextField
            id="total-weight-basic"
            label="Total weight"
            variant="outlined"
            size="small"
            sx={{ width: "10rem" }}
          />
          <TextField
            id="outlined-basic"
            label="Outlined"
            variant="outlined"
            size="small"
            sx={{ width: "10rem" }}
          />
          <TextField
            id="bags-basic"
            label="Bags count"
            variant="outlined"
            size="small"
            sx={{ width: "10rem" }}
          />

          <TextField
            id="rate-per-quintal-basic"
            label="Rate per quintal"
            variant="outlined"
            size="small"
            sx={{ width: "10rem" }}
          />

          <TextField
            id="labour-charge-basic"
            label="Labour charge"
            variant="outlined"
            size="small"
            sx={{ width: "10rem" }}
          />

          <TextField
            id="tare-per-bag-basic"
            label="Tare per bag (kg)"
            variant="outlined"
            size="small"
            sx={{ width: "10rem" }}
          />
        </BillContainer>

        {/* Summary */}
        <BillSummaryContainer>
          <TextField
            id="outlined-basic"
            label="Outlined"
            variant="outlined"
            size="small"
          />
          <TextField
            id="outlined-basic"
            label="Outlined"
            variant="outlined"
            size="small"
          />
          <TextField
            id="outlined-basic"
            label="Outlined"
            variant="outlined"
            size="small"
          />
          <TextField
            id="outlined-basic"
            label="Outlined"
            variant="outlined"
            size="small"
          />
        </BillSummaryContainer>
      </BillBodyContainer>
    </BillMainContainer>
  );
};

export default index;
