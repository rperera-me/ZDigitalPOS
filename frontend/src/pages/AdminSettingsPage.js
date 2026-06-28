import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveSettings } from "../app/settingsSlice";

const PAPER_WIDTHS = [
  { value: "58mm", label: "58mm — Narrow thermal" },
  { value: "80mm", label: "80mm — Standard thermal" },
  { value: "auto", label: "A4 / Full width" },
];

const LANGUAGES = [
  { value: "si", label: "Sinhala (සිංහල)" },
  { value: "en", label: "English" },
];

const TEMPLATES = [
  { value: "ReceiptTemplate", label: "Standard — with logo, savings, loyalty" },
  { value: "MinimalReceipt", label: "Minimal — compact, no logo" },
];

function compressImage(file, maxWidth = 160) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminSettingsPage() {
  const dispatch = useDispatch();
  const saved = useSelector((state) => state.settings);

  const [form, setForm] = useState({ ...saved });
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const logoInputRef = useRef();

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
    setSaveMsg("");
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    const base64 = await compressImage(file);
    set("storeLogo", base64);
    e.target.value = "";
  }

  function handleSave() {
    dispatch(saveSettings(form));
    setDirty(false);
    setSaveMsg("Settings saved successfully.");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  function handleReset() {
    setForm({ ...saved });
    setDirty(false);
    setSaveMsg("");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Store Information */}
      <Section title="Store Information" icon={StoreIcon}>
        <Field label="Store Name" required>
          <input
            className="input"
            value={form.storeName}
            onChange={(e) => set("storeName", e.target.value)}
            placeholder="e.g. Retail Stores"
          />
        </Field>

        <Field label="Store Address">
          <textarea
            className="input resize-none"
            rows={2}
            value={form.storeAddress}
            onChange={(e) => set("storeAddress", e.target.value)}
            placeholder="e.g. 123 Main St, Colombo"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Contact / Phone">
            <input
              className="input"
              value={form.storeContact}
              onChange={(e) => set("storeContact", e.target.value)}
              placeholder="e.g. 0770123456"
            />
          </Field>

          <Field label="Currency Symbol">
            <input
              className="input"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
              placeholder="e.g. Rs"
              maxLength={5}
            />
          </Field>
        </div>
      </Section>

      {/* Bill Logo */}
      <Section title="Bill / Receipt Logo" icon={ImageIcon}>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {form.storeLogo ? (
              <div className="relative w-32 h-20 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-white overflow-hidden">
                <img
                  src={form.storeLogo}
                  alt="Store logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs">No logo</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <p className="text-sm text-gray-600">
              Upload a logo to appear at the top of printed receipts. Image will be resized to fit.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                {form.storeLogo ? "Change Logo" : "Upload Logo"}
              </button>
              {form.storeLogo && (
                <button
                  type="button"
                  onClick={() => set("storeLogo", "")}
                  className="btn-danger-outline text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </Section>

      {/* Receipt Settings */}
      <Section title="Receipt Settings" icon={ReceiptIcon}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Paper / Bill Size">
            <select
              className="input"
              value={form.paperWidth}
              onChange={(e) => set("paperWidth", e.target.value)}
            >
              {PAPER_WIDTHS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Receipt Language">
            <select
              className="input"
              value={form.receiptLanguage}
              onChange={(e) => set("receiptLanguage", e.target.value)}
            >
              {LANGUAGES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Default Receipt Template">
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <label
                key={t.value}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
                  form.defaultReceiptTemplate === t.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="template"
                  value={t.value}
                  checked={form.defaultReceiptTemplate === t.value}
                  onChange={() => set("defaultReceiptTemplate", t.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">{t.label}</span>
              </label>
            ))}
          </div>
        </Field>
      </Section>

      {/* Save bar */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={!dirty}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save Settings
        </button>
        {dirty && (
          <button
            onClick={handleReset}
            className="text-gray-600 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-sm"
          >
            Discard Changes
          </button>
        )}
        {saveMsg && (
          <span className="text-green-600 font-medium text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {saveMsg}
          </span>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 2px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus { border-color: #3b82f6; }
        .btn-secondary {
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.375rem 0.875rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-secondary:hover { background: #f9fafb; }
        .btn-danger-outline {
          background: white;
          border: 2px solid #fca5a5;
          border-radius: 0.5rem;
          padding: 0.375rem 0.875rem;
          font-weight: 600;
          color: #dc2626;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-danger-outline:hover { background: #fef2f2; }
      `}</style>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-5">
        <Icon />
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function StoreIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
