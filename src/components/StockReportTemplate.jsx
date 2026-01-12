import React, { forwardRef } from 'react';

export const StockReportTemplate = forwardRef(({ stockPlace, records, totals, deductions }, ref) => {
    
    // Calculate timestamp
    const printDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    return (
        <div ref={ref} style={{
            width: '210mm',
            padding: '20px',
            backgroundColor: 'white',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: '14px',
            color: 'black'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: '0', textTransform: 'uppercase', fontSize: '24px', fontWeight: 'bold' }}>MRS TRADERS</h2>
                <h3 style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'normal' }}>
                    {stockPlace} Stock Report
                </h3>
                 <p style={{ margin: '5px 0', fontSize: '12px' }}>Generated on: {printDate}</p>
            </div>

            {/* Table */}
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid black',
                marginBottom: '20px'
            }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={{ border: '1px solid black', padding: '5px', textAlign: 'center', width: '40px' }}>#</th>
                        <th style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>Customer Name</th>
                        <th style={{ border: '1px solid black', padding: '5px', textAlign: 'right', width: '80px' }}>Bags</th>
                        <th style={{ border: '1px solid black', padding: '5px', textAlign: 'right', width: '100px' }}>Weight (kg)</th>
                        <th style={{ border: '1px solid black', padding: '5px', textAlign: 'right', width: '120px' }}>Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((row, index) => (
                        <tr key={index}>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'left' }}>{row.customerName}</td>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'right' }}>{row.bags}</td>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'right' }}>{row.weight}</td>
                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'right' }}>
                                {row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {records.length === 0 && (
                         <tr>
                            <td colSpan="5" style={{ border: '1px solid black', padding: '10px', textAlign: 'center' }}>No records found for this stock place.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Detailed Calculations / Totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <table style={{ borderCollapse: 'collapse', width: '350px', fontSize: '13px' }}>
                    <tbody>
                         {/* Bags */}
                         <tr>
                             <td style={{ padding: '3px 10px', textAlign: 'right' }}>Total Bags:</td>
                             <td style={{ padding: '3px 10px', border: '1px solid black', width: '100px', textAlign: 'right', fontWeight: 'bold' }}>{totals.totalBags}</td>
                         </tr>
                         {/* Weight Calculation */}
                         <tr>
                             <td style={{ padding: '3px 10px', textAlign: 'right' }}>Gross Weight (kg):</td>
                             <td style={{ padding: '3px 10px', border: '1px solid black', textAlign: 'right' }}>{totals.totalWeight}</td>
                         </tr>
                         <tr>
                             <td style={{ padding: '3px 10px', textAlign: 'right', color: '#555' }}>Less: Tare (2kg/bag):</td>
                             <td style={{ padding: '3px 10px', border: '1px solid black', textAlign: 'right', color: '#555' }}>- {deductions?.tareDeduction || 0}</td>
                         </tr>
                         <tr style={{ backgroundColor: '#f9f9f9' }}>
                             <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 'bold' }}>Net Weight (kg):</td>
                             <td style={{ padding: '5px 10px', border: '1px solid black', textAlign: 'right', fontWeight: 'bold' }}>{totals?.netWeightAfterTare || totals.totalWeight}</td>
                         </tr>

                         {/* Gap */}
                         <tr><td colSpan="2" style={{ height: '10px' }}></td></tr>

                         {/* Amount Calculation */}
                         <tr>
                            <td style={{ padding: '3px 10px', textAlign: 'right' }}>Total Amount (₹):</td>
                            <td style={{ padding: '3px 10px', border: '1px solid black', textAlign: 'right' }}>
                                {totals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                        {deductions?.perBagCharge > 0 && (
                            <tr>
                                <td style={{ padding: '3px 10px', textAlign: 'right', color: '#555' }}>
                                    Less: Charges (₹{deductions.perBagCharge}/bag):
                                </td>
                                <td style={{ padding: '3px 10px', border: '1px solid black', textAlign: 'right', color: '#555' }}>
                                    - {deductions.totalDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        )}
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Final Amount (₹):</td>
                            <td style={{ padding: '8px 10px', border: '1px double black', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>
                                {totals?.finalAmountAfterDeductions ? totals.finalAmountAfterDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : totals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* KPIs / Insights */}
            <div style={{ marginTop: '20px', borderTop: '1px dashed black', paddingTop: '10px' }}>
                <div style={{ display: 'flex', gap: '40px' }}>
                     <div>
                        <strong>Avg Weight Per Bag (Gross): </strong>
                        {totals.avgWeightPerBag} kg
                    </div>
                </div>
            </div>
        </div>
    );
});
