export const minimalReceiptTemplate = `
<div class="receipt-container">
  <div class="receipt-header">
    <h2 class="store-name">{{storeName}}</h2>
    <p class="store-contact">{{storeContact}}</p>
  </div>

  <div class="receipt-info">
    <p>{{invoiceNo}} | {{cashier}} | {{date}}</p>
  </div>

  <table class="items-table">
    <tbody>
    {{#each items}}
      <tr>
        <td>{{quantity}}x {{name}}</td>
        <td style="text-align: right;">{{formatCurrency total}}</td>
      </tr>
    {{/each}}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="total-row final-total">
      <span><strong>TOTAL:</strong></span>
      <span class="amount"><strong>{{formatCurrency finalAmount}}</strong></span>
    </div>
    <div class="total-row">
      <span>Paid:</span>
      <span class="amount">{{formatCurrency totalPaid}}</span>
    </div>
    <div class="total-row">
      <span>Change:</span>
      <span class="amount">{{formatCurrency change}}</span>
    </div>
  </div>

  <div class="thank-you">
    <p>Thank you!</p>
  </div>
</div>
`;