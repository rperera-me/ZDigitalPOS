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
    const num = parseFloat(value) || 0;
    return `${num.toFixed(2)}`;
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
      ? Math.floor(saleData.finalAmount / 100)
      : 0;

    // Calculate total paid from payments
    const totalPaid = saleData.payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) 
      || parseFloat(saleData.amountPaid || 0);

    // Calculate savings (difference between regular price and selling price)
    const savings = saleData.saleItems?.reduce((sum, item) => {
      const regularPrice = parseFloat(item.regularPrice || item.price);
      const sellingPrice = parseFloat(item.price);
      const quantity = parseFloat(item.quantity || 1);
      return sum + ((regularPrice - sellingPrice) * quantity);
    }, 0) || 0;

    // Enhance items with calculated totals and regular prices
    const enhancedItems = (saleData.saleItems || []).map(item => ({
      ...item,
      regularPrice: item.regularPrice || item.price,
      total: parseFloat(item.price) * parseFloat(item.quantity || 1)
    }));

    const template = Handlebars.compile(receiptTemplate);
    const data = {
      storeName: saleData.storeName || "Your Store Name",
      storeAddress: saleData.storeAddress || "No 07 Bandararayaka Mawatha Alawwa",
      storeContact: saleData.storeContact || "Tel: 0714373020 | 0714904322",
      invoiceNo: saleData.invoiceNo || saleData.id || "IN-1-1-1",
      date: new Date(saleData.date).toLocaleString(),
      cashier: saleData.cashier || "Cashier #1",
      customer: saleData.customer || null,
      items: enhancedItems,
      totalAmount: saleData.totalAmount,
      discountType: saleData.discountType,
      discountValue: saleData.discountValue,
      discountAmount: saleData.discountAmount || 0,
      finalAmount: saleData.finalAmount || saleData.totalAmount,
      totalPaid: totalPaid,
      payments: saleData.payments || [{ type: saleData.paymentType, amount: saleData.amountPaid }],
      change: saleData.change || 0,
      savings: savings > 0 ? savings : null,
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