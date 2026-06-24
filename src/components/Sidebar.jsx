
import {
  LayoutDashboard,
  Send,
  History,
  LogOut,
  PlusCircle,
  ArrowDownCircle,
  User,
  X,
  Shield,
  CreditCard,
  ChevronRight,
  CalendarClock,
  Gauge,
  Landmark,
  Wallet,
  Eye,
  Briefcase,
  Users,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { logout } from "../utils/logout";


const navItem = (isActive) =>
  `group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 text-sm font-medium ${
    isActive
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
  }`;

const NavIcon = ({ isActive, children }) => (
  <span
    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
      isActive
        ? "bg-white/20 text-white"
        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
    }`}
  >
    {children}
  </span>
);

const BankLogo = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5 text-white"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div>
      <p className="text-[15px] font-semibold text-slate-800 leading-tight">
        NeoBank
      </p>

      <p className="text-[11px] text-slate-400 font-medium tracking-wide">
        Digital Banking
      </p>
    </div>
  </div>
);

const NavEntry = ({ to, icon, label, onClose }) => (
  <NavLink
    to={to}
    className={({ isActive }) => navItem(isActive)}
    onClick={onClose}
  >
    {({ isActive }) => (
      <>
        <NavIcon isActive={isActive}>
          {icon}
        </NavIcon>

        <span className="flex-1">
          {label}
        </span>

        {isActive && (
          <ChevronRight
            size={14}
            className="opacity-60"
          />
        )}
      </>
    )}
  </NavLink>
);

const SidebarContent = ({ onClose }) => {
  const email = localStorage.getItem("email");
  const role = localStorage.getItem("role");

  const isAdmin = role === "ADMIN";

  const initials = email
    ? email.slice(0, 2).toUpperCase()
    : "NB";

  return (
    <div className="flex h-full flex-col px-4 py-6">

      {/* Logo */}
      <div className="mb-8 px-1">
        <BankLogo />
      </div>

      {/* User Card */}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 px-3 py-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white shadow-sm">
          {initials}
        </div>

        <div className="min-w-0 flex-1">

          <p className="truncate text-[13px] font-medium text-slate-700">
            {email || "Welcome back"}
          </p>

          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              isAdmin
                ? "bg-violet-100 text-violet-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {isAdmin ? "Admin" : "Customer"}
          </span>

        </div>
      </div>

      {/* Navigation */}
     <nav className="flex-1 space-y-0.5">

  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
    Main
  </p>

  <NavEntry
    to="/dashboard"
    icon={<LayoutDashboard size={15} />}
    label="Dashboard"
    onClose={onClose}
  />

  <NavEntry
    to="/profile"
    icon={<User size={15} />}
    label="Profile"
    onClose={onClose}
  />

  <NavEntry
    to="/transactions"
    icon={<History size={15} />}
    label="Transactions"
    onClose={onClose}
  />

  {!isAdmin && (
    <>
      {/* Banking */}
      <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Banking
      </div>

      <NavEntry
        to="/deposit"
        icon={<PlusCircle size={15} />}
        label="Deposit"
        onClose={onClose}
      />

      <NavEntry
        to="/transfer"
        icon={<Send size={15} />}
        label="Transfer"
        onClose={onClose}
      />

      <NavEntry
        to="/withdraw"
        icon={<ArrowDownCircle size={15} />}
        label="Withdraw"
        onClose={onClose}
      />

      <NavEntry
        to="/scheduled-transfers"
        icon={<CalendarClock size={15} />}
        label="Scheduled Transfers"
        onClose={onClose}
      />

      <NavEntry
        to="/limits"
        icon={<Gauge size={15} />}
        label="Limits Overview"
        onClose={onClose}
      />

      {/* Fixed Deposits */}
      <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Fixed Deposits
      </div>

      <NavEntry
        to="/fd/create"
        icon={<Landmark size={15} />}
        label="Open FD"
        onClose={onClose}
      />

      <NavEntry
        to="/fd/my-fds"
        icon={<Wallet size={15} />}
        label="My FDs"
        onClose={onClose}
      />

      {/* Services */}
      <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Services
      </div>

      <NavEntry
        to="/kyc"
        icon={<Shield size={15} />}
        label="KYC Verification"
        onClose={onClose}
      />
    </>
  )}

  {isAdmin && (
    <>
      <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Admin
      </div>

      <NavEntry
        to="/admin/transactions"
        icon={<CreditCard size={15} />}
        label="All Transactions"
        onClose={onClose}
      />

      <NavEntry
        to="/admin/kyc"
        icon={<Shield size={15} />}
        label="KYC Panel"
        onClose={onClose}
      />

      {/* FD Management */}
      <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        FD Management
      </div>

      <NavEntry
        to="/admin/fds"
        icon={<Briefcase size={15} />}
        label="Manage FDs"
        onClose={onClose}
      />

      <NavEntry
        to="/admin/fd-maturities"
        icon={<Eye size={15} />}
        label="Upcoming Maturities"
        onClose={onClose}
      />

      <NavEntry
        to="/admin/customers"
        icon={<Users size={15} />}
        label="Customers"
        onClose={onClose}
      />
    </>
  )}

</nav>

      {/* Footer */}
      <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">

        <div className="flex items-center gap-2 rounded-xl px-3 py-2">

          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            System operational
          </span>

        </div>

        <button
          type="button"
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-400 transition group-hover:bg-red-100">
            <LogOut size={15} />
          </span>

          Sign out
        </button>

      </div>
    </div>
  );
};

export default function Sidebar({
  mobileOpen,
  onClose,
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 flex-col border-r border-slate-100 bg-white lg:flex">
        <SidebarContent onClose={onClose} />
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-0 z-50 flex lg:hidden ${
          mobileOpen ? "" : "pointer-events-none"
        }`}
      >
        <div
          className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen
              ? "opacity-100"
              : "opacity-0"
          }`}
          onClick={onClose}
        />

        <aside
          className={`relative z-10 w-72 bg-white shadow-2xl transition-transform duration-300 ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>

          <SidebarContent onClose={onClose} />
        </aside>

      </div>
    </>
  );
}
