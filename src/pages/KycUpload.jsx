import { useEffect, useRef, useState } from "react";
import API from "../api/api";
import { Shield, Upload, X, CheckCircle, Clock, XCircle, FileText, CreditCard, MapPin, Building2, Hash } from "lucide-react";

export default function KycUpload() {
  const [form, setForm] = useState({
    panNumber: "",
    aadhaarNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [panFile, setPanFile] = useState(null);
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);

  const [toast, setToast] = useState({ message: "", type: "" });
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const panInputRef = useRef();
  const aadhaarInputRef = useRef();

  const email = localStorage.getItem("email");

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (file, setFile, setPreview) => {
    if (!file) return;
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const removeFile = (setFile, setPreview) => {
    setFile(null);
    setPreview(null);
  };

  const validateForm = () => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadhaarRegex = /^[0-9]{12}$/;

    if (!form.panNumber || !form.aadhaarNumber) {
      showToast("PAN & Aadhaar are required", "error"); return false;
    }
    if (!panRegex.test(form.panNumber)) {
      showToast("Invalid PAN format (ABCDE1234F)", "error"); return false;
    }
    if (!aadhaarRegex.test(form.aadhaarNumber)) {
      showToast("Aadhaar must be 12 digits", "error"); return false;
    }
    if (form.panNumber === form.aadhaarNumber) {
      showToast("PAN and Aadhaar cannot be same", "error"); return false;
    }
    if (!panFile || !aadhaarFile) {
      showToast("Both PAN & Aadhaar files required", "error"); return false;
    }
    return true;
  };

  const fetchKycStatus = async () => {
    try {
      const res = await API.get(`/kyc/me?email=${email}`);
      setKycStatus(res.data.status);
    } catch {
      console.log("No KYC found yet");
    }
  };

  useEffect(() => { fetchKycStatus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      data.append("email", email);
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      data.append("panFile", panFile);
      data.append("aadhaarFile", aadhaarFile);

      const res = await API.post("/kyc/submit", data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      showToast(res.data || "KYC Submitted Successfully");
      fetchKycStatus();
    } catch (err) {
      showToast(err?.response?.data || "KYC Submission Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    APPROVED: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: <CheckCircle size={18} />, label: "KYC Approved" },
    REJECTED: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: <XCircle size={18} />, label: "KYC Rejected" },
    PENDING: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: <Clock size={18} />, label: "KYC Under Review" },
  };

  const FileUploadBox = ({ label, file, preview, setFile, setPreview, inputRef, icon }) => (
    <div className="space-y-2">
      <p className="text-[13px] font-medium text-slate-600 flex items-center gap-1.5">{icon}{label}</p>
      <input
        type="file"
        hidden
        ref={inputRef}
        accept="image/*,.pdf"
        onChange={(e) => handleFile(e.target.files[0], setFile, setPreview)}
      />
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current.click()}
          className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 group"
        >
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
            <Upload size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Click to upload</p>
            <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, PDF up to 10MB</p>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
          {preview && file.type?.startsWith("image/") ? (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full h-44 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button
                type="button"
                onClick={() => removeFile(setFile, setPreview)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors shadow"
              >
                <X size={14} />
              </button>
              <p className="absolute bottom-2 left-3 text-xs text-white font-medium truncate max-w-[80%]">{file.name}</p>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileText size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{file.name}</p>
                  <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(setFile, setPreview)}
                className="h-7 w-7 rounded-full hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">KYC Verification</h1>
            <p className="text-sm text-slate-500 mt-0.5">Complete your identity verification to unlock all features</p>
          </div>
        </div>

        {/* Status Banner */}
        {kycStatus && (() => {
          const s = statusConfig[kycStatus] || statusConfig.PENDING;
          return (
            <div className={`mb-6 flex items-center gap-3 px-4 py-3.5 rounded-2xl border ${s.bg} ${s.border} ${s.text}`}>
              {s.icon}
              <div>
                <p className="text-sm font-semibold">{s.label}</p>
                {kycStatus === "PENDING" && <p className="text-xs opacity-70 mt-0.5">We'll notify you once verification is complete</p>}
                {kycStatus === "REJECTED" && <p className="text-xs opacity-70 mt-0.5">Please re-submit with valid documents</p>}
              </div>
            </div>
          );
        })()}

        {/* Toast */}
        {toast.message && (
          <div className={`mb-6 flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium ${
            toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {toast.type === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {toast.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identity Details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Identity Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">PAN Number</label>
                <input
                  name="panNumber"
                  placeholder="ABCDE1234F"
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Aadhaar Number</label>
                <input
                  name="aadhaarNumber"
                  placeholder="XXXX XXXX XXXX"
                  onChange={handleChange}
                  maxLength={12}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Address Details</h2>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Street Address</label>
              <input
                name="address"
                placeholder="House no, Street, Area"
                onChange={handleChange}
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">City</label>
                <input
                  name="city"
                  placeholder="City"
                  onChange={handleChange}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">State</label>
                <input
                  name="state"
                  placeholder="State"
                  onChange={handleChange}
                  className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Pincode</label>
              <input
                name="pincode"
                placeholder="6-digit pincode"
                onChange={handleChange}
                maxLength={6}
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
              />
            </div>
          </div>

          {/* Document Upload */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Upload Documents</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUploadBox
                label="PAN Card"
                file={panFile}
                preview={panPreview}
                setFile={setPanFile}
                setPreview={setPanPreview}
                inputRef={panInputRef}
                icon={<Hash size={13} className="text-slate-400" />}
              />
              <FileUploadBox
                label="Aadhaar Card"
                file={aadhaarFile}
                preview={aadhaarPreview}
                setFile={setAadhaarFile}
                setPreview={setAadhaarPreview}
                inputRef={aadhaarInputRef}
                icon={<Building2 size={13} className="text-slate-400" />}
              />
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
              <Shield size={11} /> Your documents are encrypted and securely stored
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <Shield size={16} />
                Submit KYC
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}