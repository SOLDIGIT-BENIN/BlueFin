import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LogOut, User, Bell, Settings, Moon, Sun, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function AdminHeader() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.history.pushState({}, '', '/admin-login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <header className="bg-white dark:bg-[#0f2940]/90 backdrop-blur-sm shadow-lg px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#e2f5f2] dark:border-[#1c3b56]/50 transition-colors duration-300 sticky top-0 z-50">
      {/* Logo et titre */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-[#0f2940] dark:text-white transition-colors">
            Administration
          </h1>
          <p className="text-xs text-[#5b6b7a] dark:text-[#5b6b7a] hidden sm:block transition-colors">
            Bluefin Immo Dashboard
          </p>
        </div>
      </div>

      {/* Actions et profil */}
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
        <button className="p-2 rounded-lg bg-[#e8faf6] dark:bg-[#1c3b56]/50 hover:bg-[#e2f5f2] dark:hover:bg-[#5b6b7a]/50 transition border border-[#e2f5f2] dark:border-[#5b6b7a]/50 text-[#5b6b7a] dark:text-[#5b6b7a] hover:text-[#1c3b56] dark:hover:text-white">
          <Search className="w-4 h-4" />
        </button>

        <button className="p-2 rounded-lg bg-[#e8faf6] dark:bg-[#1c3b56]/50 hover:bg-[#e2f5f2] dark:hover:bg-[#5b6b7a]/50 transition border border-[#e2f5f2] dark:border-[#5b6b7a]/50 text-[#5b6b7a] dark:text-[#5b6b7a] hover:text-[#1c3b56] dark:hover:text-white relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold shadow-lg shadow-red-500/30">
            3
          </span>
        </button>

        <div className="w-px h-8 bg-[#e2f5f2] dark:bg-[#1c3b56]/50 hidden sm:block transition-colors"></div>

        {/* Profil utilisateur */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 bg-[#e8faf6] dark:bg-[#1c3b56]/30 rounded-lg px-3 py-1.5 border border-[#e2f5f2] dark:border-[#5b6b7a]/50 hover:bg-[#e2f5f2] dark:hover:bg-[#5b6b7a]/50 transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-[#1c3b56] dark:text-white transition-colors">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-[#5b6b7a] dark:text-[#5b6b7a] transition-colors">Administrateur</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#5b6b7a] dark:text-[#5b6b7a] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#0f2940] rounded-xl shadow-xl border border-[#e2f5f2] dark:border-[#1c3b56]/50 py-1 z-50 overflow-hidden transition-colors">
              <div className="px-4 py-2 border-b border-[#e2f5f2] dark:border-[#1c3b56]/50">
                <p className="text-xs text-[#5b6b7a] dark:text-[#5b6b7a]">Connecté en tant que</p>
                <p className="text-sm font-medium text-[#1c3b56] dark:text-white truncate">
                  {user?.email}
                </p>
              </div>
              
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#5b6b7a] dark:text-[#9fb3c4] hover:bg-[#f4fffe] dark:hover:bg-[#1c3b56]/50 transition"
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-[#e0ac1f]" />
                    <span>Mode clair</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#00806b]" />
                    <span>Mode sombre</span>
                  </>
                )}
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#5b6b7a] dark:text-[#9fb3c4] hover:bg-[#f4fffe] dark:hover:bg-[#1c3b56]/50 transition">
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </button>
              
              <div className="border-t border-[#e2f5f2] dark:border-[#1c3b56]/50"></div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
      )}
    </header>
  );
}