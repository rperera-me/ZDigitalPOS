import React, { useMemo } from "react";
import Handlebars from "handlebars";
import { receiptTemplate } from "./templates/ReceiptTemplate";
import { useTranslation } from "react-i18next";
import "./ReceiptView.css";

// Register i18n helper
if (!Handlebars.helpers.i18n) {
  Handlebars.registerHelper("i18n", function(key, options) {
    return options.data.root.i18n(key);
  });
}

// Register formatCurrency helper
if (!Handlebars.helpers.formatCurrency) {
  Handlebars.registerHelper("formatCurrency", function(value) {
    return `Rs ${parseFloat(value).toFixed(2)}`;
  });
}

// Register eq helper for equality comparison
if (!Handlebars.helpers.eq) {
  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });
}

// Register gt helper for greater than comparison
if (!Handlebars.helpers.gt) {
  Handlebars.registerHelper("gt", function(a, b) {
    return a > b;
  });
}

export default function ReceiptView({ saleData }) {
  const { t } = useTranslation();

  const receiptHtml = useMemo(() => {
    if (!saleData) return "";
    
    // Calculate points earned in this sale
    const pointsEarned = saleData.customer?.type === "loyalty" && saleData.customer?.creditBalance <= 0
      ? Math.floor(saleData.totalAmount / 100)
      : 0;

    const template = Handlebars.compile(receiptTemplate);
    const data = {
      storeName: saleData.storeName || "Your Store Name",
      date: new Date(saleData.date).toLocaleString(),
      cashier: saleData.cashier || "Cashier #1",
      customer: saleData.customer || null,
      items: saleData.saleItems || [],
      totalAmount: saleData.totalAmount,
      discountType: saleData.discountType,
      discountValue: saleData.discountValue,
      discountAmount: saleData.discountAmount,
      finalAmount: saleData.finalAmount || saleData.totalAmount,
      payments: saleData.payments || [{ type: saleData.paymentType, amount: saleData.amountPaid }],
      change: saleData.change || 0,
      pointsEarned: pointsEarned,
      i18n: t,
    };
    
    return template(data);
  }, [saleData, t]);

  return (
    <div
      className="receipt-preview"
      dangerouslySetInnerHTML={{ __html: receiptHtml }}
    />
  );
}