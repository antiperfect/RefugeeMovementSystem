import React from 'react';
import COUNTRY_OUTLINES from '../data/countryOutlines';

interface PredictionResult {
  country: string;
  year: number;
  refugees: number;
  food: number;
  shelter: number;
  medical: number;
  water: number;
  is_neighbor: boolean;
}

interface NewsArticle {
  title: string;
  url: string;
  seendate: string;
  domain: string;
  socialimage?: string;
}

const NEIGHBOR_COUNTRIES = [
  'Afghanistan', 'Bangladesh', 'China', 'Myanmar',
  'Pakistan', 'Sri Lanka'
];

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const ResourcePlan = () => {
  const [predictions, setPredictions] = React.useState<PredictionResult[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [alerts, setAlerts] = React.useState<NewsArticle[]>([]);
  const [loadingAlerts, setLoadingAlerts] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Fetch ML predictions
  React.useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/flask/api/predict-all?year=2026');
        if (res.ok) {
          const data = await res.json();
          setPredictions(data.filter((p: PredictionResult) => NEIGHBOR_COUNTRIES.includes(p.country)));
        }
      } catch (err) {
        console.error('Flask API error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  // Fetch live humanitarian news via Flask backend (GDELT server-side)
  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/flask/api/news');
        if (res.ok) {
          const data = await res.json();
          if (data.articles && Array.isArray(data.articles)) {
            setAlerts(data.articles);
          }
        }
      } catch (err) {
        console.error('News API Error:', err);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
  }, []);

  // Auto-scroll effect
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || loadingAlerts) return;
    let raf: number;
    const speed = 0.5;
    const scroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += speed;
      }
      raf = requestAnimationFrame(scroll);
    };
    const pause = () => cancelAnimationFrame(raf);
    const resume = () => { raf = requestAnimationFrame(scroll); };
    el.addEventListener('mouseenter', pause, { passive: true });
    el.addEventListener('mouseleave', resume, { passive: true });
    raf = requestAnimationFrame(scroll);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
    };
  }, [loadingAlerts]);

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    // GDELT uses format like '20260224T120000Z' — normalize it
    let normalized = dateStr;
    if (/^\d{14}$/.test(dateStr)) {
      // Pure digits: 20260224120000
      normalized = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}T${dateStr.slice(8,10)}:${dateStr.slice(10,12)}:${dateStr.slice(12,14)}Z`;
    } else if (/^\d{8}T\d{6}Z?$/.test(dateStr)) {
      // 20260224T120000Z
      const d = dateStr.replace('Z','');
      normalized = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}T${d.slice(9,11)}:${d.slice(11,13)}:${d.slice(13,15)}Z`;
    }
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return '';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  // Resource totals from ML predictions
  const totals = React.useMemo(() => ({
    food: predictions.reduce((s, p) => s + p.food, 0),
    shelter: predictions.reduce((s, p) => s + p.shelter, 0),
    medical: predictions.reduce((s, p) => s + p.medical, 0),
    water: predictions.reduce((s, p) => s + p.water, 0),
    refugees: predictions.reduce((s, p) => s + p.refugees, 0),
  }), [predictions]);

  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-6 bg-transparent lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-3 lg:gap-4 animate-fade-in-up lg:min-h-0 lg:overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-extrabold leading-tight tracking-tight text-on-surface dark:text-white mb-2 font-headline">Resource Planning</h1>
            <p className="text-on-surface-variant dark:text-gray-400 font-body max-w-2xl text-sm lg:text-base">ML-predicted resource requirements for neighboring country displacement into India (2026).</p>
          </div>
        </div>

        {/* Resource Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 flex-shrink-0">
          <div className="sm:col-span-2 flex h-24 lg:h-28 rounded-xl overflow-hidden shadow-sm">
            <div className="w-[30%] bg-primary-container flex flex-col justify-center items-center text-on-primary-container">
              <span className="material-symbols-outlined text-2xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              <span className="text-xs font-bold uppercase tracking-widest text-center leading-tight">Food</span>
            </div>
            <div className="w-[70%] bg-surface-container-lowest dark:bg-white/5 p-4 lg:p-6 flex flex-col justify-center">
              <div className="text-2xl lg:text-3xl font-black text-on-surface dark:text-white">
                {loading ? '...' : formatNumber(totals.food)}
              </div>
              <span className="text-xs text-on-surface-variant mt-1">Predicted food units required</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-white/5 p-4 lg:p-6 rounded-xl shadow-sm border-l-4 border-error">
            <div className="flex justify-between items-start mb-3 lg:mb-4">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-on-surface dark:text-white mb-1">
              {loading ? '...' : formatNumber(totals.shelter)}
            </div>
            <div className="text-xs font-bold text-on-surface-variant dark:text-gray-400">Shelter Units Required</div>
          </div>

          <div className="bg-surface-container-lowest dark:bg-white/5 p-4 lg:p-6 rounded-xl shadow-sm border-l-4 border-secondary">
            <div className="flex justify-between items-start mb-3 lg:mb-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-on-surface dark:text-white mb-1">
              {loading ? '...' : formatNumber(totals.medical)}
            </div>
            <div className="text-xs font-bold text-on-surface-variant dark:text-gray-400">Medical Kits Required</div>
          </div>
        </div>

        {/* Live News + Resource Table */}
        <div className="flex-1 flex flex-col gap-3 lg:gap-4 min-h-0 overflow-hidden">

          <div className="flex-[3] grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-stretch min-h-0">
            {/* Live News Feed */}
            <div className="lg:col-span-1 flex flex-col gap-2 min-h-0">
              <h3 className="text-base lg:text-lg font-bold text-on-surface dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency_home</span>
                Humanitarian News
              </h3>

              <div className="relative flex-1 min-h-0 overflow-hidden">
                <div ref={scrollRef} className="h-full overflow-y-auto no-scrollbar pr-1 space-y-3 rounded-xl" style={{ maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }}>
                  {loadingAlerts ? (
                    <div className="p-12 text-center text-on-surface-variant text-sm font-bold flex flex-col items-center">
                      <span className="material-symbols-outlined animate-spin text-4xl mb-4 text-primary">progress_activity</span>
                      Loading news...
                    </div>
                  ) : alerts.length > 0 ? (
                    alerts.map((alert, idx) => (
                      <a
                        key={idx}
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 lg:p-4 bg-surface-container-lowest dark:bg-white/5 hover:bg-surface-container-low dark:hover:bg-white/10 transition-colors rounded-xl border border-outline-variant/30 dark:border-white/10 relative group cursor-pointer"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-error rounded-l-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-on-surface-variant dark:text-gray-500 uppercase bg-surface-container-high dark:bg-white/10 px-2 py-0.5 rounded">{alert.domain || 'News'}</span>
                          <span className="text-[10px] font-bold text-error">{timeAgo(alert.seendate || new Date().toISOString())}</span>
                        </div>
                        <p className="text-xs lg:text-sm font-bold text-on-surface dark:text-white leading-tight mt-2 line-clamp-2">{alert.title}</p>
                      </a>
                    ))
                  ) : (
                    <div className="p-8 text-center text-outline text-sm">No news available. Check your internet connection.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Per-Country Resource Breakdown */}
            <div className="lg:col-span-2 bg-surface-container-lowest dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-0">
              <div className="p-4 lg:p-6 border-b border-outline-variant/10 dark:border-white/5 flex-shrink-0">
                <h4 className="font-headline font-bold text-on-surface dark:text-white text-sm lg:text-base">Per-Country Resource Breakdown</h4>
                <p className="text-[10px] text-on-surface-variant mt-1">ML-predicted resource needs by origin country (2026)</p>
              </div>
              <div className="overflow-y-auto flex-1 min-h-0 p-2">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                  </div>
                ) : predictions.length > 0 ? (
                  <div className="space-y-3 p-2">
                    {predictions.map(p => (
                      <div key={p.country} className="bg-surface-container-low/60 dark:bg-white/5 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-on-surface-variant text-sm">flag</span>
                            <span className="font-bold text-sm text-on-surface dark:text-white">{p.country}</span>
                          </div>
                          <span className="text-xs font-bold text-primary dark:text-blue-400">{formatNumber(p.refugees)} displaced</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Food', value: p.food, color: 'text-amber-600 dark:text-amber-400' },
                            { label: 'Shelter', value: p.shelter, color: 'text-error' },
                            { label: 'Medical', value: p.medical, color: 'text-secondary' },
                            { label: 'Water', value: p.water, color: 'text-blue-500' },
                          ].map(r => (
                            <div key={r.label} className="text-center">
                              <div className={`text-sm font-black ${r.color}`}>{formatNumber(r.value)}</div>
                              <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">{r.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-on-surface-variant text-sm">
                    Flask prediction server not connected.<br />
                    <code className="text-xs bg-surface-container-high dark:bg-white/10 px-2 py-1 rounded mt-2 inline-block">python app.py</code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Water Supply Summary */}
          <div className="flex-[1] bg-surface-container-lowest dark:bg-white/5 rounded-2xl shadow-sm p-4 sm:p-5 lg:p-6 flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-sm lg:text-base font-bold text-on-surface dark:text-white mb-3 flex-shrink-0 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>water_drop</span>
              Water Supply Requirements
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 flex-1">
              {predictions.map(p => {
                const path = COUNTRY_OUTLINES[p.country];
                return (
                  <div key={p.country} className="bg-surface-container-low/60 dark:bg-white/5 rounded-lg p-3 text-center flex flex-col items-center">
                    <div className="text-lg font-black text-blue-500">{formatNumber(p.water)}</div>
                    <div className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">{p.country}</div>
                    {path && (
                      <svg viewBox="0 0 100 100" className="w-16 h-16 mt-2" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-primary/30 dark:text-blue-400/30" />
                      </svg>
                    )}
                  </div>
                );
              })}
              {predictions.length === 0 && !loading && (
                <div className="col-span-full text-center text-on-surface-variant text-xs py-4">Connect Flask server for data</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResourcePlan;
