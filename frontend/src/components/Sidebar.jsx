import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Stethoscope,
  Activity,
  ClipboardList,
  Pill,
  FlaskConical,
  HeartPulse,
  AlertTriangle,
  Users,
  Calendar,
  GitCompare,
  BarChart3,
  FileCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  ShieldAlert,
  X,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({
  currentSection,
  setCurrentSection,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  theme,
  setTheme,
  counts = {},
}) {
  const navSections = [
    {
      group: 'Core Platform',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'documents', label: 'Document Center', icon: FileText },
        { id: 'extraction', label: 'Medical Extraction', icon: Stethoscope, badge: counts?.total },
      ],
    },
    {
      group: 'Clinical Domains',
      items: [
        { id: 'symptoms', label: 'Symptoms Analysis', icon: Activity, badge: counts?.symptoms },
        { id: 'conditions', label: 'Conditions Analysis', icon: ClipboardList, badge: counts?.diagnoses },
        { id: 'medications', label: 'Medication Analytics', icon: Pill, badge: counts?.medications },
        { id: 'labs', label: 'Laboratory Analytics', icon: FlaskConical, badge: counts?.lab_results },
        { id: 'vitals', label: 'Vital Signs', icon: HeartPulse, badge: counts?.vital_signs },
        { id: 'allergies', label: 'Allergies', icon: AlertTriangle, badge: counts?.allergies },
        { id: 'family_history', label: 'Family History', icon: Users, badge: counts?.family_history },
      ],
    },
    {
      group: 'Intelligence & Reporting',
      items: [
        { id: 'timeline', label: 'Medical Timeline', icon: Calendar },
        { id: 'comparison', label: 'Document Comparison', icon: GitCompare },
        { id: 'analytics', label: 'Analytics Center', icon: BarChart3 },
        { id: 'reports', label: 'Report Generator', icon: FileCheck },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavClick = (id) => {
    setCurrentSection(id);
    if (mobileOpen) setMobileOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out shadow-sm ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleNavClick('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 flex-shrink-0 group transition-all duration-300 hover:scale-105">
              <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 truncate block">
                  MediExtract AI
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase truncate block">
                  Clinical Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  {sec.group}
                </p>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;

                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-xs dark:bg-blue-950/70 dark:text-blue-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400 scale-110'
                            : 'text-slate-400 dark:text-slate-500 group-hover:scale-110'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1 text-left">{item.label}</span>
                      )}
                      {!collapsed && item.badge > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isActive
                              ? 'bg-blue-200/80 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && !collapsed && (
                        <span className="w-1.5 h-4 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </button>

                    {/* Tooltip on collapsed mode */}
                    {collapsed && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                        {item.badge > 0 && ` (${item.badge})`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Disclaimer Warning Box */}
        {!collapsed && (
          <div className="mx-3 mb-2 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-[11px] leading-tight flex-shrink-0">
            <div className="flex items-center gap-1.5 font-semibold mb-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Demonstration Only</span>
            </div>
            <p className="opacity-90 text-[10px]">Rule-based extraction for demonstration. Not for clinical use.</p>
          </div>
        )}

        {/* Bottom Utility Controls */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 flex-shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {!collapsed && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                {!collapsed && <span>Dark Mode</span>}
              </>
            )}
          </button>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
