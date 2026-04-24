import { useEffect, useState, useMemo } from 'react';
import unData from '../data/undata.json';

interface RefugeeData {
  year: number;
  origin: string;
  refugees: number;
}

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

const NEIGHBOR_COUNTRIES = [
  'Afghanistan', 'Bangladesh', 'China', 'Myanmar',
  'Pakistan', 'Sri Lanka'
];

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
};

const Analysis = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await fetch('/api/flask/api/predict-all?year=2026');
        if (res.ok) {
          const data = await res.json();
          setPredictions(data);
          setApiConnected(true);
        }
      } catch { /* Flask not running */ }
    };
    fetchPredictions();
  }, []);

  // Compute growth trend from UN data
  const growthAnalysis = useMemo(() => {
    const validData = unData as RefugeeData[];
    const years = [...new Set(validData.map(d => d.year))].sort((a, b) => a - b);
    const recentYears = years.filter(y => y >= 2015);

    const yearTotals = recentYears.map(year => ({
      year,
      total: validData.filter(d => d.year === year).reduce((s, d) => s + d.refugees, 0)
    }));

    // Add 2026 prediction if available
    if (predictions.length > 0) {
      const predicted2026 = predictions
        .filter(p => NEIGHBOR_COUNTRIES.includes(p.country))
        .reduce((s, p) => s + p.refugees, 0);
      
      yearTotals.push({
        year: 2026,
        total: predicted2026
      });
    }

    if (yearTotals.length < 2) return { trend: 'Insufficient Data', change: 0, yearTotals };

    const first = yearTotals[0].total;
    const last = yearTotals[yearTotals.length - 1].total;
    const change = ((last - first) / first * 100);

    return {
      trend: change > 5 ? 'Increasing' : change < -5 ? 'Decreasing' : 'Stable',
      change: Math.round(change),
      yearTotals,
    };
  }, [predictions]);

  // Top origin countries by historical data
  const topOrigins = useMemo(() => {
    const validData = unData as RefugeeData[];
    const latestYear = Math.max(...validData.map(d => d.year));
    const latest = validData.filter(d => d.year === latestYear);
    return latest
      .sort((a, b) => b.refugees - a.refugees)
      .slice(0, 8);
  }, []);

  // Compare historical vs predicted
  const comparison = useMemo(() => {
    const validData = unData as RefugeeData[];
    const latestYear = Math.max(...validData.map(d => d.year));
    const historicalTotal = validData
      .filter(d => d.year === latestYear)
      .reduce((s, d) => s + d.refugees, 0);

    const predictedTotal = predictions
      .filter(p => NEIGHBOR_COUNTRIES.includes(p.country))
      .reduce((s, p) => s + p.refugees, 0);

    const diff = predictedTotal - historicalTotal;
    const pctChange = historicalTotal > 0 ? Math.round((diff / historicalTotal) * 100) : 0;

    return { historicalTotal, predictedTotal, diff, pctChange, latestYear };
  }, [predictions]);

  // Neighbor predictions for detail
  const neighborPredictions = useMemo(() => {
    return predictions.filter(p => NEIGHBOR_COUNTRIES.includes(p.country));
  }, [predictions]);

  return (
    <div className="flex-1 w-full p-6 lg:p-10 bg-transparent">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-bold text-on-surface dark:text-white tracking-tight mb-2">Strategic Analysis</h1>
          <p className="font-body text-on-surface-variant dark:text-gray-400 text-xs sm:text-sm max-w-2xl">
            Trend analysis derived from UNHCR historical data ({growthAnalysis.yearTotals.length > 0 ? `${growthAnalysis.yearTotals[0].year}–2026` : '2015–2026'}) and ML model predictions.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Trend Overview */}
          <div className="col-span-1 lg:col-span-7 bg-surface-container-low dark:bg-white/5 rounded-xl flex flex-col md:flex-row overflow-hidden border border-white/40 dark:border-white/10">
            <div className="bg-primary-container p-6 md:w-1/3 flex flex-col justify-center text-on-primary-container relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at top right, white, transparent)' }}></div>
              <span className="font-body text-xs font-semibold tracking-wider uppercase mb-2 opacity-80">Displacement Trend</span>
              <div className="font-headline text-4xl font-black mb-1">
                {growthAnalysis.change > 0 ? '+' : ''}{growthAnalysis.change}%
              </div>
              <p className="font-body text-sm leading-tight opacity-90">
                Overall displacement trend since 2015. Direction: <strong>{growthAnalysis.trend}</strong>.
              </p>
            </div>
            <div className="bg-surface-container-lowest dark:bg-[#111827] p-6 md:w-2/3 flex flex-col">
              <h3 className="font-headline text-lg font-bold text-on-surface dark:text-white mb-4">Year-over-Year Totals</h3>
              <div className="h-[200px] w-full flex items-end gap-1 px-1">
                {growthAnalysis.yearTotals.map((yt, i) => {
                  const max = Math.max(...growthAnalysis.yearTotals.map(y => y.total), 1);
                  const pct = (yt.total / max) * 100;
                  return (
                    <div key={yt.year} className="flex-1 h-full flex flex-col items-center group relative" title={`${yt.year}: ${yt.total.toLocaleString()}`}>
                      <div className="flex-1 w-full flex items-end justify-center relative">
                        <div
                          className={`w-full max-w-[32px] rounded-t-sm transition-all duration-500 relative ${
                            yt.year === 2026 ? 'bg-primary shadow-[0_0_12px_rgba(0,40,142,0.4)]' : 'bg-surface-container-high dark:bg-white/10'
                          }`}
                          style={{ height: `${Math.max(2, pct)}%` }}
                        >
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-container-highest dark:bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-primary dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-primary/20">
                            {formatNumber(yt.total)}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[8px] font-bold mt-2 ${yt.year === 2026 ? 'text-primary dark:text-blue-400' : 'text-on-surface-variant'}`}>
                        {yt.year}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Historical vs Predicted */}
          <div className="col-span-1 lg:col-span-5 bg-surface-container-low dark:bg-white/5 rounded-xl p-1 border border-white/40 dark:border-white/10">
            <div className="bg-surface-container-lowest dark:bg-[#111827] h-full rounded-lg p-4 lg:p-6 flex flex-col">
              <h3 className="font-headline text-lg font-bold text-on-surface dark:text-white mb-1">Historical vs Predicted</h3>
              <p className="font-body text-xs text-on-surface-variant mb-6">Comparing last verified year with 2026 ML forecast</p>

              {apiConnected ? (
                <div className="flex-1 flex flex-col justify-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-surface-container-low dark:bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">UNHCR 2025</div>
                      <div className="font-headline text-2xl font-black text-on-surface dark:text-white">{formatNumber(comparison.historicalTotal)}</div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
                    <div className="flex-1 bg-surface-container-low dark:bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-[10px] font-bold text-primary dark:text-blue-400 uppercase tracking-wider mb-2">ML Predicted 2026</div>
                      <div className="font-headline text-2xl font-black text-on-surface dark:text-white">{formatNumber(comparison.predictedTotal)}</div>
                    </div>
                  </div>
                  <div className={`text-center text-sm font-bold ${comparison.diff > 0 ? 'text-error' : 'text-green-600'}`}>
                    {comparison.diff > 0 ? '↑' : '↓'} {formatNumber(Math.abs(comparison.diff))} ({comparison.pctChange > 0 ? '+' : ''}{comparison.pctChange}%)
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm text-center">
                  <div>
                    Connect Flask server for comparison<br/>
                    <code className="text-xs bg-surface-container-high dark:bg-white/10 px-2 py-1 rounded mt-2 inline-block">python app.py</code>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Origin Countries */}
          <div className="col-span-1 lg:col-span-8 bg-surface-container-low dark:bg-white/5 rounded-xl p-4 lg:p-6 border border-white/40 dark:border-white/10">
            <h3 className="font-headline text-lg font-bold text-on-surface dark:text-white mb-1">Top Origin Countries</h3>
            <p className="font-body text-sm text-on-surface-variant mb-6">Highest displacement into India (latest verified year)</p>
            <div className="space-y-3">
              {topOrigins.map((origin, i) => {
                const maxLog = Math.log10(topOrigins[0].refugees + 1);
                const minLog = Math.log10(Math.max(1, topOrigins[topOrigins.length - 1].refugees));
                const logVal = Math.log10(origin.refugees + 1);
                const pct = Math.max(3, ((logVal - minLog * 0.8) / (maxLog - minLog * 0.8)) * 100);
                const colors = [
                  'bg-primary',
                  'bg-primary/80',
                  'bg-primary/65',
                  'bg-primary/50',
                  'bg-primary/40',
                  'bg-primary/30',
                  'bg-primary/25',
                  'bg-primary/20',
                ];
                return (
                  <div key={origin.origin} className="flex items-center gap-4">
                    <span className="text-xs font-black text-on-surface-variant w-6 text-right">{i + 1}</span>
                    <span className="text-sm font-bold text-on-surface dark:text-white w-48 truncate">{origin.origin}</span>
                    <div className="flex-1 bg-surface-container-highest dark:bg-white/10 h-6 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${colors[i] || colors[colors.length - 1]}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-black text-on-surface dark:text-white w-24 text-right">{origin.refugees.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Sources */}
          <div className="col-span-1 lg:col-span-4 bg-surface-container-low dark:bg-white/5 rounded-xl p-4 lg:p-6 flex flex-col border border-white/40 dark:border-white/10">
            <h3 className="font-headline text-lg font-bold text-on-surface dark:text-white mb-4">Data Sources</h3>
            <div className="space-y-3 flex-1">
              <div className="bg-surface-container-lowest dark:bg-white/5 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline text-sm">database</span>
                  <span className="font-body text-sm text-on-surface">UNHCR Population Data</span>
                </div>
                <span className="bg-secondary-container text-on-secondary-container font-label text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Primary</span>
              </div>
              <div className="bg-surface-container-lowest dark:bg-white/5 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline text-sm">smart_toy</span>
                  <span className="font-body text-sm text-on-surface">Random Forest Model</span>
                </div>
                <span className={`font-label text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${apiConnected ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                  {apiConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <div className="bg-surface-container-lowest dark:bg-white/5 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline text-sm">newspaper</span>
                  <span className="font-body text-sm text-on-surface">GDELT News Feed</span>
                </div>
                <span className="bg-secondary-container text-on-secondary-container font-label text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">Live</span>
              </div>
            </div>

            {/* Neighbor Resource Summary */}
            {apiConnected && neighborPredictions.length > 0 && (
              <div className="mt-6 pt-4 border-t border-outline-variant/20 dark:border-white/10">
                <h4 className="text-sm font-bold text-on-surface dark:text-white mb-3">2026 Resource Summary</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Food', value: neighborPredictions.reduce((s, p) => s + p.food, 0), color: 'text-amber-600' },
                    { label: 'Shelter', value: neighborPredictions.reduce((s, p) => s + p.shelter, 0), color: 'text-error' },
                    { label: 'Medical', value: neighborPredictions.reduce((s, p) => s + p.medical, 0), color: 'text-secondary' },
                    { label: 'Water', value: neighborPredictions.reduce((s, p) => s + p.water, 0), color: 'text-blue-500' },
                  ].map(r => (
                    <div key={r.label} className="bg-surface-container-lowest dark:bg-white/5 rounded-lg p-2 text-center">
                      <div className={`text-sm font-black ${r.color}`}>{formatNumber(r.value)}</div>
                      <div className="text-[9px] font-bold text-on-surface-variant uppercase">{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
