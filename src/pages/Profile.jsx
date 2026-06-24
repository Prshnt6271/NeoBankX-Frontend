import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import {
  User, Mail, Phone, CreditCard, Shield, Edit3,
  Lock, CheckCircle, XCircle, Eye, EyeOff, Camera,
  MapPin, Building2, BadgeCheck
} from "lucide-react";

const fieldMap = {
  current: "currentPassword",
  new: "newPassword",
  confirm: "confirmPassword",
};

const PasswordInput = ({ label, field, placeholder, passwordData, setPasswordData, showPass, setShowPass }) => (
  <div className="space-y-1.5">
    <label className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">{label}</label>
    <div className="relative">
      <input
        type={showPass[field] ? "text" : "password"}
        value={passwordData[fieldMap[field]]}
        onChange={(e) => setPasswordData({ ...passwordData, [fieldMap[field]]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition"
      />
      <button
        type="button"
        onClick={() => setShowPass(p => ({ ...p, [field]: !p[field] }))}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {showPass[field] ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  </div>
);

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState({ firstName: "", lastName: "", mobile: "", address: "" });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await API.get("/profile");
      setProfile(res.data);
      setEditData({
        firstName: res.data.firstName || "",
        lastName: res.data.lastName || "",
        mobile: res.data.mobile || "",
        address: res.data.address || "",
      });
    } catch (err) {
      showToast("Failed to load profile", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const updateProfile = async () => {
    if (!editData.firstName.trim() || !editData.lastName.trim()) {
      showToast("First name and last name are required", "error"); return;
    }
    if (editData.mobile && !/^[0-9]{10,15}$/.test(editData.mobile)) {
      showToast("Mobile number must be 10-15 digits", "error"); return;
    }
    try {
      setIsSaving(true);
      const res = await API.put("/profile", editData);
      showToast(res.data?.message || "Profile updated successfully!");
      fetchProfile();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally { setIsSaving(false); }
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      showToast("Please fill all password fields", "error"); return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("New passwords do not match", "error"); return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error"); return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
      showToast("Password must include at least one special character", "error"); return;
    }
    try {
      setIsSaving(true);
      const res = await API.post("/profile/change-password", passwordData);
      if (res.data === "Password Updated Successfully") {
        showToast(res.data);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showToast(res.data, "error");
      }
    } catch (err) {
      showToast(err.response?.data || "Failed to change password", "error");
    } finally { setIsSaving(false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const isActive = profile?.active || profile?.isActive;
  const initials = profile
    ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase()
    : "NB";

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-9 w-9 text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm text-slate-500 font-medium">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-xl transition-all ${
          toast.type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}>
          {toast.type === "error" ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-5">

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-10 text-white shadow-xl shadow-indigo-200">
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
          <div className="absolute right-16 bottom-0 h-32 w-32 rounded-full bg-white/5" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-3xl overflow-hidden border-4 border-white/20 shadow-xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current.click()}
                className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-lg hover:shadow-xl transition"
              >
                <Camera size={14} className="text-indigo-600" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-semibold">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                {isActive && <BadgeCheck size={22} className="text-emerald-400" />}
              </div>
              <p className="text-indigo-200 text-sm">{profile?.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive ? "bg-emerald-400/20 text-emerald-300" : "bg-red-400/20 text-red-300"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-red-400"}`} />
                  {isActive ? "Active Account" : "Inactive Account"}
                </span>
                {profile?.accountType && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    <CreditCard size={11} />{profile.accountType}
                  </span>
                )}
                {profile?.role && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    <Shield size={11} />{profile.role}
                  </span>
                )}
              </div>
            </div>

            {/* Account number */}
            {profile?.accountNumber && (
              <div className="shrink-0 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm px-5 py-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-indigo-300 mb-1">Account No.</p>
                <p className="font-mono text-base font-bold text-white">{profile.accountNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 shadow-sm p-1.5">
          {[
            { key: "info", label: "Personal Info",    icon: <User size={14} /> },
            { key: "edit", label: "Edit Profile",     icon: <Edit3 size={14} /> },
            { key: "pass", label: "Change Password",  icon: <Lock size={14} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Personal Info */}
        {activeTab === "info" && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-7 space-y-5">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <User size={18} className="text-indigo-500" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "First Name",     value: profile?.firstName,           icon: <User size={14} className="text-indigo-400" /> },
                { label: "Last Name",      value: profile?.lastName,            icon: <User size={14} className="text-indigo-400" /> },
                { label: "Email Address",  value: profile?.email,               icon: <Mail size={14} className="text-indigo-400" /> },
                { label: "Mobile Number",  value: profile?.mobile || "—",       icon: <Phone size={14} className="text-indigo-400" /> },
                { label: "Account Number", value: profile?.accountNumber || "—", icon: <CreditCard size={14} className="text-indigo-400" />, mono: true },
                { label: "Account Type",   value: profile?.accountType || "—",  icon: <Building2 size={14} className="text-indigo-400" /> },
              ].map(f => (
                <div key={f.label} className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                    {f.icon}{f.label}
                  </div>
                  <p className={`text-sm font-medium text-slate-800 ${f.mono ? "font-mono" : ""}`}>{f.value}</p>
                </div>
              ))}

              <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  <MapPin size={14} className="text-indigo-400" /> Address
                </div>
                <p className="text-sm font-medium text-slate-800">{profile?.address || "—"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Edit Profile */}
        {activeTab === "edit" && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-7 space-y-5">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Edit3 size={18} className="text-indigo-500" /> Update Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "First Name",    field: "firstName", placeholder: "Enter first name",   type: "text" },
                { label: "Last Name",     field: "lastName",  placeholder: "Enter last name",    type: "text" },
                { label: "Mobile Number", field: "mobile",    placeholder: "10-15 digit number", type: "tel" },
              ].map(f => (
                <div key={f.field} className="space-y-1.5">
                  <label className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">{f.label}</label>
                  <input
                    type={f.type}
                    value={editData[f.field]}
                    onChange={(e) => setEditData({ ...editData, [f.field]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>
              ))}

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">Address</label>
                <textarea
                  rows={3}
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  placeholder="Enter your full address"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
                />
              </div>
            </div>

            <button
              onClick={updateProfile}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-8 py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-indigo-200 disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <><CheckCircle size={15} /> Save Changes</>
              )}
            </button>
          </div>
        )}

        {/* Tab: Change Password */}
        {activeTab === "pass" && (
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-7 space-y-5">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Lock size={18} className="text-rose-500" /> Change Password
            </h2>

            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
              <Shield size={15} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                Password must be at least 6 characters and include at least one special character (!@#$%^&* etc.)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PasswordInput
                label="Current Password"
                field="current"
                placeholder="Enter current password"
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                showPass={showPass}
                setShowPass={setShowPass}
              />
              <PasswordInput
                label="New Password"
                field="new"
                placeholder="Min 6 chars + special char"
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                showPass={showPass}
                setShowPass={setShowPass}
              />
              <PasswordInput
                label="Confirm Password"
                field="confirm"
                placeholder="Confirm new password"
                passwordData={passwordData}
                setPasswordData={setPasswordData}
                showPass={showPass}
                setShowPass={setShowPass}
              />
            </div>

            <button
              onClick={changePassword}
              disabled={isSaving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 px-8 py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-rose-200 disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Updating...
                </>
              ) : (
                <><Lock size={15} /> Update Password</>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}