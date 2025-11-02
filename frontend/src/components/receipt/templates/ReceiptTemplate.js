export const receiptTemplate = `
<div class="receipt-container">
  <div class="receipt-header">
    <img src="logo192.png" alt="Store Logo" class="store-logo" />
    <h2 class="store-name">{{i18n "storeName"}}</h2>
  </div>

  <div class="receipt-info">
    <p><strong>{{i18n "date"}}:</strong> {{date}}</p>
    <p><strong>{{i18n "cashier"}}:</strong> {{cashier}}</p>
  </div>

  <hr class="divider"/>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align:left;">{{i18n "item"}}</th>
        <th style="text-align:center;">{{i18n "qty"}}</th>
        <th style="text-align:right;">{{i18n "price"}}</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="text-align: left;">{{name}}</td>
        <td style="text-align: center;">{{quantity}}</td>
        <td style="text-align: right;">{{price}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <hr class="divider"/>

  <div class="total-section">
    <p class="total"><strong>{{i18n "total"}}:</strong> {{totalAmount}}</p>
  </div>

  <div class="payment-info">
    <p><strong>{{i18n "paymentType"}}:</strong> {{paymentType}}</p>
    <p><strong>{{i18n "amountPaid"}}:</strong> {{amountPaid}}</p>
    <p><strong>{{i18n "change"}}:</strong> {{change}}</p>
  </div>

  <div class="thank-you">
    <p>{{i18n "thankYou"}}</p>
  </div>
</div>
`;
