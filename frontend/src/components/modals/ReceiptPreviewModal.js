import React, { forwardRef, useState, useEffect } from "react";
import Modal from "react-modal";
import ReceiptView from "../receipt/ReceiptView";
import LanguageToggle from "../LanguageToggle";
import { useTranslation } from "react-i18next";

Modal.setAppElement("#root");

const ReceiptModal = forwardRef(({ isOpen, onClose, saleData, templateName = 'ReceiptTemplate' }, ref) => {
  const { t, i18n } = useTranslation();
  const [printing, setPrinting] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(templateName);

  // Load available templates on mount
  useEffect(() => {
    if (window.electronAPI?.getAvailableTemplates) {
      window.electronAPI.getAvailableTemplates().then(result => {
        if (result.success) {
          setAvailableTemplates(result.templates);
        }
      });
    }
  }, []);

  // Thermal printer print
  const handleThermalPrint = async () => {
    setPrinting(true);
    try {
      const translations = i18n.getResourceBundle(i18n.language, 'translation');
      
      const result = await window.electronAPI.printReceipt({
        saleData,
        translations,
        templateName: selectedTemplate // Use selected template
      });
      
      if (result.success) {
        setTimeout(() => onClose(), 500);
      } else {
        console.error("Print failed:", result.error);
        alert(`Print failed: ${result.error}`);
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
      {/* Template Selector (if multiple templates available) */}
      {availableTemplates.length > 1 && (
        <div style={{
          padding: "10px 20px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb"
        }}>
          <label style={{ fontSize: "12px", color: "#6b7280", marginRight: "8px" }}>
            Template:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              fontSize: "12px"
            }}
          >
            {availableTemplates.map(template => (
              <option key={template} value={template}>
                {template.replace(/([A-Z])/g, ' $1').trim()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scrollable content area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px",
      }}>
        <div ref={ref}>
          <ReceiptView saleData={saleData} templateName={selectedTemplate} />
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
            }}
          >
            {t("ui.close")}
          </button>
          
          {/* Thermal Print (Primary) */}
          <button
            onClick={handleThermalPrint}
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
            {printing ? "⏳ Printing..." : `🖨️ ${t("ui.printReceipt")}`}
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default ReceiptModal;