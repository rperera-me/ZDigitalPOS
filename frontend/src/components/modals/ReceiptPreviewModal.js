import React, { forwardRef, useState } from "react";
import Modal from "react-modal";
import ReceiptView from "../receipt/ReceiptView";
import LanguageToggle from "../LanguageToggle";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

const isElectron = () => typeof window !== "undefined" && !!window.electronAPI;

const ReceiptModal = forwardRef(({ isOpen, onClose, saleData, templateName = 'ReceiptTemplate' }, ref) => {
  const { t } = useTranslation();
  const [printing, setPrinting] = useState(false);

  const handlePrint = async () => {
    setPrinting(true);
    try {
      if (isElectron()) {
        // Electron desktop (kiosk): send the rendered receipt HTML to the main process
        // which converts it to ESC/POS commands for the thermal printer.
        const renderedHtml = ref?.current?.innerHTML || "";
        if (!renderedHtml) {
          alert("Receipt is not ready to print.");
          return;
        }
        const result = await window.electronAPI.printReceipt({ renderedHtml });
        if (result.success) {
          setTimeout(() => onClose(), 500);
        } else {
          console.error("Thermal print failed:", result.error);
          alert(`Print failed: ${result.error}`);
        }
      } else {
        // Web browser: use the browser's native print dialog.
        // @media print CSS hides everything except .receipt-preview.
        window.print();
        setTimeout(() => onClose(), 1000);
      }
    } catch (error) {
      console.error("Print error:", error);
      alert(`Print error: ${error.message}`);
    } finally {
      setPrinting(false);
    }
  };

  if (!saleData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel={t("receipt.title") || "Receipt"}
      style={{
        overlay: {
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 1000,
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
      {/* Scrollable receipt preview */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        <div ref={ref}>
          <ReceiptView saleData={saleData} templateName={templateName} />
        </div>
      </div>

      {/* Footer: language toggle + action buttons */}
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
            disabled={printing}
            style={{
              backgroundColor: "#d1d5db",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {t("ui.close")}
          </button>

          <button
            onClick={handlePrint}
            disabled={printing}
            style={{
              backgroundColor: printing ? "#9ca3af" : "#16a34a",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: printing ? "not-allowed" : "pointer",
              fontWeight: "500",
            }}
          >
            {printing ? "Printing..." : `🖨️ ${t("ui.printReceipt")}`}
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default ReceiptModal;
