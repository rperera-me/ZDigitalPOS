import React, { useMemo } from "react";
import Handlebars from "handlebars";
import { receiptTemplate } from "./templates/ReceiptTemplate";
import { useTranslation } from "react-i18next";
import "./ReceiptView.css";

// Register i18n helper once
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

export default function ReceiptView({ saleData }) {
  const { t } = useTranslation();

  const receiptHtml = useMemo(() => {
    if (!saleData) return "";
    
    const template = Handlebars.compile(receiptTemplate);
    const data = {
      storeName: saleData.storeName || "Your Store Name",
      date: new Date(saleData.date).toLocaleString(),
      cashier: saleData.cashier || "Cashier #1",
      items: saleData.saleItems || [],
      totalAmount: `Rs ${parseFloat(saleData.totalAmount).toFixed(2)}`,
      paymentType: saleData.paymentType,
      amountPaid: `Rs ${parseFloat(saleData.amountPaid).toFixed(2)}`,
      change: `Rs ${parseFloat(saleData.change || 0).toFixed(2)}`,
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