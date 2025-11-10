import React, { forwardRef } from "react";
import Modal from "react-modal";
import ReceiptView from "../receipt/ReceiptView";
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
          padding: "20px",
          overflow: "auto",
        },
      }}
    >
      <div style={{ textAlign: "center", fontFamily: "Arial" }}>
        <h3 style={{ marginBottom: "15px" }}>
          {t("receipt.preview") || "Receipt Preview"}
        </h3>
        
        <div ref={ref} style={{ marginBottom: "20px" }}>
          <ReceiptView saleData={saleData} />
        </div>

        <div style={{ 
          display: "flex", 
          gap: "10px", 
          justifyContent: "center",
          marginTop: "20px" 
        }}>
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            style={{
              backgroundColor: "#16a34a",
              color: "white",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            style={{
              backgroundColor: "#d1d5db",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
});

export default ReceiptModal;
