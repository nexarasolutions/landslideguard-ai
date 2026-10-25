import { useCallback, useState, useEffect } from 'react';
import {
  Activity, BarChart3, Bell, BrainCircuit, FileText,
  LayoutDashboard, Map, Menu, Radio, Search, Settings, ShieldAlert, X,
  User as UserIcon, LogOut
} from 'lucide-react';
import { api, getStoredUser } from './services/api';
import { useAsync } from './hooks';
import { Async, Card, LiveStatusBadge } from './components/ui';
import Overview from './pages/Overview';
import Live from './pages/Live';
import StationDetail from './pages/StationDetail';
import Alerts from './pages/Alerts';
import StationMap from './components/StationMap';
import RiskPrediction from './pages/RiskPrediction';
import SensorManagement from './pages/SensorManagement';
import HistoricalAnalytics from './pages/HistoricalAnalytics';
import Reports from './pages/Reports';
import SettingsPage from './pages/SettingsPage';
import AuthModal from './components/AuthModal';
import type { User } from './types';

const NAV = [
  ['Overview', LayoutDashboard],
  ['Live Monitoring', Activity],
  ['Risk Prediction', BrainCircuit],
  ['Landslide Risk Map', Map],
  ['Alerts & Notifications', Bell],
  ['Sensor Management', Radio],
  ['Historical Analytics', BarChart3],
  ['Reports', FileText],
  ['Settings', Settings]
] as const;

export default function App() {
  const [page, setPage] = useState<string>('Overview');
  const [sel, setSel] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => getStoredUser() || {
    id: 'usr-nex-001',
    email: 'nexaraautotechsolution@gmail.com',
    name: 'Nexara Mission Admin',
    role: 'Admin'
  });

  const st = useAsync(api.stations, [], 4000);
  const al = useAsync(api.alerts, [], 4000);
  const stations = st.data ?? [];
  const alerts = al.data ?? [];


  const open = useCallback((id: string) => {
    setSel(id);
    setPage('Live Monitoring');
  }, []);

  const go = (p: string) => {
    setPage(p);
    setSel(null);
    setMenu(false);
  };

  const ack = async (id: string) => {
    await api.acknowledge(id, user ? `${user.name} (${user.role})` : 'Mission Operator');
    al.reload();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setAuthOpen(true);
  };

  const unread = alerts.filter(a => !a.acknowledged).length;
  const filteredStations = stations.filter(s =>
    search ? s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase()) : true
  );
  const station = stations.find(s => s.id === sel);

  const body = () => {
    if (page === 'Overview') return <Overview stations={filteredStations} alerts={alerts} open={open} />;
    if (page === 'Live Monitoring') return station ? <StationDetail station={station} back={() => setSel(null)} /> : <Live stations={filteredStations} open={open} />;
    if (page === 'Risk Prediction') return <RiskPrediction />;
    if (page === 'Landslide Risk Map') return <Card title="Geospatial Hazard Map" right={<LiveStatusBadge />}><StationMap stations={filteredStations} onSelect={open} /></Card>;
    if (page === 'Alerts & Notifications') return <Alerts alerts={alerts} ack={ack} />;
    if (page === 'Sensor Management') return <SensorManagement stations={stations} reload={st.reload} openDetail={open} />;
    if (page === 'Historical Analytics') return <HistoricalAnalytics stations={stations} />;
    if (page === 'Reports') return <Reports stations={stations} alerts={alerts} />;
    if (page === 'Settings') return <SettingsPage />;
    return <Card title={page}><p className="py-10 text-center text-slate-400">Page not found.</p></Card>;
  };

  return (
    <div className="flex min-h-screen bg-navy text-slate-200">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-line bg-panel p-3 transition-transform md:static md:translate-x-0 ${menu ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Main navigation">
        <div className="mb-4 flex items-center justify-between px-2 py-2">
          <span className="flex items-center gap-2 font-semibold text-white">
            <ShieldAlert className="text-accent" />
            LandslideGuard AI
          </span>
          <button className="md:hidden" onClick={() => setMenu(false)} aria-label="Close menu"><X /></button>
        </div>
        <nav className="space-y-1">
          {NAV.map(([n, Icon]) => (
            <button
              key={n}
              onClick={() => go(n)}
              aria-current={page === n}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                page === n ? 'bg-accent/15 text-accent font-semibold' : 'text-slate-300 hover:bg-navy'
              }`}
            >
              <Icon size={18} />
              {n}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-line bg-navy/95 px-4 py-3 backdrop-blur">
          <button className="md:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu /></button>
          <label className="relative hidden sm:block">
            <Search size={16} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              aria-label="Search"
              placeholder="Search stations or IDs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-56 rounded-md border border-line bg-panel py-1.5 pl-8 pr-2 text-xs text-white placeholder-slate-400 outline-none focus:border-accent"
            />
          </label>

          <select
            aria-label="Monitoring location"
            value={sel || ''}
            onChange={e => e.target.value ? open(e.target.value) : setSel(null)}
            className="rounded-md border border-line bg-panel px-2 py-1.5 text-xs text-slate-200 outline-none"
          >
            <option value="">All Monitoring Stations</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
            <LiveStatusBadge />
            <span className="hidden lg:inline">Telemetry sync: {new Date().toLocaleTimeString()}</span>
            
            <button
              className="relative p-1 rounded hover:bg-panel"
              onClick={() => go('Alerts & Notifications')}
              aria-label={`${unread} unread alerts`}
            >
              <Bell size={20} className="text-slate-200" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>

            {/* User Profile & Auth Trigger */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-line pl-3">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="text-left hover:opacity-80 transition"
                  title="Switch User / View Profile"
                >
                  <span className="hidden text-slate-200 font-semibold sm:block">{user.name}</span>
                  <span className="text-[11px] text-accent font-medium block">{user.role}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-red-400 transition"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-navy hover:opacity-90"
              >
                <UserIcon size={14} /> Sign In
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6" id="main-content">
          <Async loading={st.loading} error={st.error} retry={st.reload} hasData={stations.length > 0}>
            {body()}
          </Async>
        </main>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />
    </div>
  );
}
