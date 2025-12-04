import React, { useMemo } from "react";
import Handlebars from "handlebars";
import { useTranslation } from "react-i18next";
import "./ReceiptView.css";

// Import all available templates
import { receiptTemplate } from "./templates/ReceiptTemplate";
import { minimalReceiptTemplate } from "./templates/MinimalReceiptTemplate";

// Template registry
const TEMPLATES = {
  ReceiptTemplate: receiptTemplate,
  MinimalReceipt: minimalReceiptTemplate
};

// Register Handlebars helpers once
if (!Handlebars.helpers.i18n) {
  Handlebars.registerHelper("i18n", function(key, options) {
    return options.data.root.i18n(key);
  });
}

if (!Handlebars.helpers.formatCurrency) {
  Handlebars.registerHelper("formatCurrency", function(value) {
    const num = parseFloat(value) || 0;
    return `${num.toFixed(2)}`;
  });
}

if (!Handlebars.helpers.eq) {
  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });
}

if (!Handlebars.helpers.gt) {
  Handlebars.registerHelper("gt", function(a, b) {
    return a > b;
  });
}

/**
 * ReceiptView Component
 * Renders receipt preview using selected template
 * 
 * @param {Object} saleData - Sale transaction data
 * @param {string} templateName - Template to use (default: 'ReceiptTemplate')
 */
export default function ReceiptView({ saleData, templateName = 'ReceiptTemplate' }) {
  const { t } = useTranslation();

  const receiptHtml = useMemo(() => {
    if (!saleData) return "";
    
    // Get the selected template
    const selectedTemplate = TEMPLATES[templateName] || receiptTemplate;

    // Calculate points earned in this sale
    const pointsEarned = saleData.customer?.type === "loyalty" && 
                         saleData.customer?.creditBalance <= 0
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

    // Calculate tax if needed
    const taxAmount = saleData.taxAmount || 0;

    // Enhance items with calculated totals and regular prices
    const enhancedItems = (saleData.saleItems || []).map(item => ({
      ...item,
      regularPrice: item.regularPrice || item.price,
      total: parseFloat(item.price) * parseFloat(item.quantity || 1)
    }));

    // Compile the selected template
    const template = Handlebars.compile(selectedTemplate);
    
    // Prepare data for template
    const data = {
      storeName: saleData.storeName || "",
      storeAddress: saleData.storeAddress || "",
      storeContact: saleData.storeContact || "",
      invoiceNo: saleData.invoiceNo || saleData.id || "",
      date: new Date(saleData.date).toLocaleString(),
      cashier: saleData.cashier || "",
      customer: saleData.customer || null,
      items: enhancedItems,
      totalAmount: saleData.totalAmount,
      discountType: saleData.discountType,
      discountValue: saleData.discountValue,
      discountAmount: saleData.discountAmount || 0,
      taxAmount: taxAmount,
      finalAmount: saleData.finalAmount || saleData.totalAmount,
      totalPaid: totalPaid,
      payments: saleData.payments || [{ 
        type: saleData.paymentType || 'Cash', 
        amount: saleData.amountPaid || totalPaid 
      }],
      change: saleData.change || 0,
      savings: savings > 0 ? savings : null,
      pointsEarned: pointsEarned,
      i18n: t, // Translation function for Handlebars
    };
    
    return template(data);
  }, [saleData, t, templateName]); // Added templateName to dependencies

  return (
    <div
      className="receipt-preview"
      dangerouslySetInnerHTML={{ __html: receiptHtml }}
    />
  );
}