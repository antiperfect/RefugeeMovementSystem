import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';

const TopNavBar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const settingsRef = useRef<HTMLDivElement>(null);

  // Close modals on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Init theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const navLinkClass = ({isActive}: {isActive: boolean}) =>
    isActive
      ? "text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400 pb-2 h-full flex items-center transition-all duration-300"
      : "text-[#64748b] dark:text-gray-400 font-medium h-full flex items-center hover:text-primary dark:hover:text-blue-400 transition-all duration-300 border-b-2 border-transparent pb-2";

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/30 dark:bg-[#0a0f1a]/30 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-sm transition-all duration-300 font-['Public_Sans'] font-bold tracking-tight text-sm uppercase flex justify-between items-center px-4 lg:px-8 h-16 lg:h-20">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="text-lg lg:text-xl font-black tracking-tighter flex items-center gap-2 group cursor-pointer">
            <span className="material-symbols-outlined text-primary dark:text-blue-400 group-hover:rotate-12 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary dark:from-blue-400 dark:via-teal-400 dark:to-blue-400 bg-gradient-pan bg-[length:200%_auto]">Refugee Movement System</span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <ul className="hidden lg:flex items-center gap-6 h-full">
          <li className="h-full flex items-center pt-2"><NavLink to="/" className={navLinkClass}>Dashboard</NavLink></li>
          <li className="h-full flex items-center pt-2"><NavLink to="/predictions" className={navLinkClass}>Predictions</NavLink></li>
          <li className="h-full flex items-center pt-2"><NavLink to="/resources" className={navLinkClass}>Resource Plan</NavLink></li>
          <li className="h-full flex items-center pt-2"><NavLink to="/analysis" className={navLinkClass}>Analysis</NavLink></li>
        </ul>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* Dark Mode Toggle */}
          <button onClick={toggleDark} className="p-2 rounded-full hover:bg-surface-container-high dark:hover:bg-white/10 text-[#64748b] dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 transition-all active:scale-90" title="Toggle dark mode">
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>

          {/* Settings Button */}
          <div className="relative" ref={settingsRef}>
            <button onClick={() => setSettingsOpen(!settingsOpen)} className="hidden lg:block scale-95 active:scale-90 transition-transform text-[#64748b] dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 p-2 rounded-full hover:bg-surface-container-high dark:hover:bg-white/10">
              <span className="material-symbols-outlined">settings</span>
            </button>
            {settingsOpen && (
              <div className="absolute top-14 right-0 w-80 bg-white dark:bg-[#111827] border border-outline-variant/20 dark:border-white/10 rounded-2xl shadow-2xl p-6 z-50 animate-fade-in-up">
                <h3 className="font-headline font-bold text-on-surface dark:text-white text-lg mb-6">Settings</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-surface-container-low dark:bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary dark:text-blue-400 text-sm">dark_mode</span>
                      <span className="text-sm font-semibold text-on-surface dark:text-white normal-case">Dark Mode</span>
                    </div>
                    <button onClick={toggleDark} className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-primary' : 'bg-outline-variant/40'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-sm ${isDark ? 'left-[26px]' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-surface-container-low dark:bg-white/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary dark:text-blue-400 text-sm">language</span>
                      <span className="text-sm font-semibold text-on-surface dark:text-white normal-case">Language</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant dark:text-gray-500 normal-case">English</span>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant dark:text-gray-600 mt-6 text-center normal-case">Refugee Movement System v1.0</p>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-surface-container-high dark:hover:bg-white/10 text-[#64748b] dark:text-gray-400 active:scale-90 transition-all">
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
          <div className="absolute top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-white dark:bg-[#111827] shadow-2xl border-l border-outline-variant/20 dark:border-white/10 animate-fade-in-up flex flex-col">
            <div className="p-6 space-y-2 flex-1">
              {[
                { to: "/", label: "Dashboard", icon: "dashboard" },
                { to: "/predictions", label: "Predictions", icon: "insights" },
                { to: "/resources", label: "Resource Plan", icon: "inventory_2" },
                { to: "/analysis", label: "Analysis", icon: "analytics" }
              ].map(link => (
                <NavLink key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors normal-case ${isActive ? 'bg-primary/10 dark:bg-blue-400/10 text-primary dark:text-blue-400' : 'text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-low dark:hover:bg-white/5'}`}>
                  <span className="material-symbols-outlined text-lg">{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-4 border-t border-outline-variant/20 dark:border-white/10 mt-4">
                <button onClick={toggleDark} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors normal-case w-full">
                  <span className="material-symbols-outlined text-lg">{isDark ? 'light_mode' : 'dark_mode'}</span>
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavBar;
