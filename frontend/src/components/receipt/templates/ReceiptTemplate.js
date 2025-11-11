export const receiptTemplate = `
<div class="receipt-container">
  <div class="receipt-header">
    <img src="logo192.png" alt="Store Logo" class="store-logo" />
    <h2 class="store-name">{{storeName}}</h2>
  </div>

  <div class="receipt-info">
    <p><strong>Date:</strong> {{date}}</p>
    <p><strong>Cashier:</strong> {{cashier}}</p>
    {{#if customer}}
    <p><strong>Customer:</strong> {{customer.name}}</p>
    {{#if customer.phone}}
    <p><strong>Phone:</strong> {{customer.phone}}</p>
    {{/if}}
    {{/if}}
  </div>

  <hr class="divider"/>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align:left;">Item</th>
        <th style="text-align:center;">Qty</th>
        <th style="text-align:right;">Price</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td style="text-align: left;">{{name}}</td>
        <td style="text-align: center;">{{quantity}}</td>
        <td style="text-align: right;">Rs {{price}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <hr class="divider"/>

  {{#if discountAmount}}
  <div class="discount-section">
    <p><strong>Discount:</strong> {{discountType}} {{discountValue}}</p>
    <p><strong>Discount Amount:</strong> Rs {{discountAmount}}</p>
  </div>
  {{/if}}

  <div class="total-section">
    <p class="total"><strong>Final Total:</strong> Rs {{finalAmount}}</p>
  </div>

  <div class="payment-info">
    <p><strong>Payment Methods:</strong></p>
    {{#each payments}}
    <p>{{type}}: Rs {{amount}}{{#if cardLastFour}} (****{{cardLastFour}}){{/if}}</p>
    {{/each}}
    {{#if change}}
    <p><strong>Change:</strong> Rs {{change}}</p>
    {{/if}}
  </div>

  {{#if customer}}
  {{#if customer.type}}
  {{#if (eq customer.type "loyalty")}}
  <hr class="divider"/>
  <div class="loyalty-info" style="text-align: center; background: #f3e8ff; padding: 8px; border-radius: 6px; margin: 8px 0;">
    {{#if customer.loyaltyPoints}}
    <p style="margin: 2px 0; font-weight: bold; color: #7c3aed;">💜 Loyalty Points: {{customer.loyaltyPoints}} pts</p>
    {{/if}}
    {{#if pointsEarned}}
    <p style="margin: 2px 0; color: #059669; font-weight: bold;">✨ Points Earned: +{{pointsEarned}} pts</p>
    {{/if}}
    {{#if customer.creditBalance}}
    {{#if (gt customer.creditBalance 0)}}
    <p style="margin: 2px 0; color: #dc2626; font-weight: bold;">Credit: Rs {{customer.creditBalance}}</p>
    <p style="margin: 2px 0; font-size: 10px; color: #6b7280;">Points paused until credit cleared</p>
    {{/if}}
    {{/if}}
  </div>
  {{/if}}
  {{/if}}
  {{/if}}

  <div class="thank-you">
    <p>Thank you for your business!</p>
    {{#if customer}}
    {{#if customer.type}}
    {{#if (eq customer.type "loyalty")}}
    <p style="font-size: 10px; margin-top: 4px;">Earn 1 point per Rs.100 spent</p>
    {{/if}}
    {{/if}}
    {{/if}}
  </div>
</div>
`;