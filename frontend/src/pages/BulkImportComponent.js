import React, { useState } from "react";
import api from "../api/axios";

export default function BulkImportComponent() {
  const [file, setFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Select a file.");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/product/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(response.data);
    } catch {
      alert("Import failed.");
    }
  };

  return (
    <div className="p-4 border rounded mb-6 bg-white">
      <h2 className="text-lg font-semibold mb-3">Bulk Product Import</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={!file}
        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Upload
      </button>
      {importResult && (
        <div className="mt-4">
          <p>Imported: {importResult.importedCount || importResult.ImportedProducts?.length}</p>
          {importResult.errors?.length > 0 && (
            <ul className="text-red-600 list-disc pl-5 mt-2">
              {importResult.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
