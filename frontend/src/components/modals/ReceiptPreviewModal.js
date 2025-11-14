import React, { forwardRef } from "react";
import Modal from "react-modal";
import ReceiptView from "../receipt/ReceiptView";
import LanguageToggle from "../LanguageToggle";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from "react-to-print";

Modal.setAppElement("#root");

const ReceiptModal = forwardRef(({ isOpen, onClose, saleData }, ref) => {
  const { t } = useTranslation();

  const handlePrint = useReactToPrint({
    content: () => ref.current,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
    documentTitle: `Receipt-${new Date().getTime()}`,
    removeAfterPrint: true,
  });

  if (!saleData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel={t("receipt.title") || "Receipt"}
      style={{
        overlay: {
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 1000
        },
        content: {
          width: "400px",
          maxHeight: "90vh",
          margin: "auto",
          borderRadius: "10px",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Scrollable content area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
      }}>
        <div ref={ref}>
          <ReceiptView saleData={saleData} />
        </div>
      </div>

      {/* Fixed footer with buttons */}
      <div style={{
        position: "sticky",
        bottom: 0,
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        padding: "15px 20px",
        display: "flex",
        gap: "10px",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.05)",
        zIndex: 10,
      }}>
        <LanguageToggle />

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#d1d5db",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#9ca3af"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#d1d5db"}
          >
            {t("ui.close") || "Close"}
          </button>
          <button
            onClick={handlePrint}
            style={{
              backgroundColor: "#16a34a",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#15803d"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#16a34a"}
          >
            {t("ui.printReceipt") || "Print"}
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default ReceiptModal;