import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Activity, Menu, X, LogOut, Sun, Moon, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bmi", label: "BMI Check" },
  { to: "/routines", label: "Routines" },
  { to: "/timer", label: "Workout Timer" },
  { to: "/vision", label: "Form Check" },
  { to: "/coach", label: "AI Coach" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-blood" strokeWidth={2.5} />
          <span className="font-display text-xl font-semibold tracking-wide text-bone">
            IRON<span className="text-blood">MIND</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-md px-4 py-2 text-sm font-medium tracking-wide transition-colors ${
                  isActive
                    ? "bg-blood/15 text-ember"
                    : "text-steel hover:bg-panel2 hover:text-bone"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setBellOpen((o) => !o);
                if (!bellOpen) markAllRead();
              }}
              className="relative rounded-md border border-line p-2 text-steel hover:border-blood hover:text-ember"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blood text-[10px] font-bold text-bone">
                  {unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-line bg-panel p-3 shadow-glowRed">
                {notifications.length === 0 ? (
                  <p className="p-3 text-center text-sm text-steel">No notifications yet.</p>
                ) : (
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="rounded-lg border border-line bg-void/40 p-3 text-sm">
                        {n.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-md border border-line p-2 text-steel hover:border-blood hover:text-ember"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <span className="text-sm text-steel">
            {user?.full_name?.split(" ")[0]}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm text-steel transition-colors hover:border-blood hover:text-ember"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <button className="md:hidden text-bone" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-panel px-6 py-4 space-y-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-md px-4 py-2 text-sm font-medium ${
                  isActive ? "bg-blood/15 text-ember" : "text-steel"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={toggleTheme}
            className="mt-2 flex w-full items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-steel"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Toggle theme
          </button>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-steel"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      )}
    </header>
  );
}
