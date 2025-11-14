export const receiptTemplate = `
<div class="receipt-container">
  <div class="receipt-header">
    <img src="logo192.png" alt="Store Logo" class="store-logo" />
    <h2 class="store-name">{{storeName}}</h2>
    <p class="store-address">{{storeAddress}}</p>
    <p class="store-contact">{{storeContact}}</p>
  </div>

  <div class="receipt-info">
    <p><strong>{{i18n "receipt.invoiceNo"}}:</strong> {{invoiceNo}}</p>
    <p><strong>{{i18n "receipt.cashier"}}:</strong> {{cashier}}</p>
    <p><strong>{{i18n "receipt.date"}}:</strong> {{date}}</p>
    {{#if customer}}
    <p><strong>{{i18n "receipt.customer"}}:</strong> {{customer.name}}</p>
    {{#if customer.phone}}
    <p><strong>{{i18n "receipt.phone"}}:</strong> {{customer.phone}}</p>
    {{/if}}
    {{/if}}
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align:left;">{{i18n "receipt.qty"}}</th>
        <th style="text-align:left;">{{i18n "receipt.price"}}</th>
        <th style="text-align:center;">{{i18n "receipt.ourPrice"}}</th>
        <th style="text-align:right;">{{i18n "receipt.amount"}}</th>
      </tr>
    </thead>
    <tbody>
    {{#each items}}
      <tr>
        <td colspan="4" style="text-align: left;">{{name}}</td>
      </tr>
      <tr>
        <td style="text-align: left;">{{quantity}}</td>
        <td style="text-align: left;">{{formatCurrency regularPrice}}</td>
        <td style="text-align: center;">{{formatCurrency price}}</td>
        <td style="text-align: right;">{{formatCurrency total}}</td>
      </tr>
      {{#unless @last}}
        <tr class="item-separator">
          <td colspan="4"></td>
        </tr>
    {{/unless}}
      {{/each}}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="total-row">
      <span>{{i18n "receipt.netTotal"}}:</span>
      <span class="amount">{{formatCurrency totalAmount}}</span>
    </div>
    <div class="total-row">
      <span>{{i18n "receipt.discount"}}:</span>
      <span class="amount">-{{formatCurrency discountAmount}}</span>
    </div>
    <div class="total-row final-total">
      <span><strong>{{i18n "receipt.finalTotal"}}:</strong></span>
      <span class="amount"><strong>{{formatCurrency finalAmount}}</strong></span>
    </div>
    <div class="total-row">
      <span>{{i18n "receipt.paidAmount"}}:</span>
      <span class="amount">{{formatCurrency totalPaid}}</span>
    </div>
    <div class="total-row">
      <span>{{i18n "receipt.balance"}}:</span>
      <span class="amount">{{formatCurrency change}}</span>
    </div>
    <div class="savings-section">
      <p><strong>{{i18n "receipt.youSaved"}}: {{formatCurrency savings}}</strong></p>
    </div>
  </div>

  {{#if customer}}
  {{#if customer.type}}
  {{#if (eq customer.type "loyalty")}}
  <hr class="divider"/>
  <div class="loyalty-info">
    {{#if customer.loyaltyPoints}}
    <p>💜 {{i18n "receipt.loyaltyPoints"}}: {{customer.loyaltyPoints}} pts</p>
    {{/if}}
    {{#if pointsEarned}}
    <p>✨ {{i18n "receipt.pointsEarned"}}: +{{pointsEarned}} pts</p>
    {{/if}}
    {{#if customer.creditBalance}}
    {{#if (gt customer.creditBalance 0)}}
    <p class="credit-warning">{{i18n "receipt.credit"}}: {{formatCurrency customer.creditBalance}}</p>
    {{/if}}
    {{/if}}
  </div>
  {{/if}}
  {{/if}}
  {{/if}}

  <div class="thank-you">
    <p>{{i18n "receipt.thankYou"}}</p>
  </div>

  <div class="footer">
    <p>{{i18n "receipt.poweredBy"}}</p>
  </div>
</div>
`;