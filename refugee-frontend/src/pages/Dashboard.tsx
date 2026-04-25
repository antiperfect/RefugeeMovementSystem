import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import unData from '../data/undata.json';
import { getEndpoint, fetchWithCache } from '../config/api';
import 'leaflet/dist/leaflet.css';

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

// Map of common origin country name to rough border coordinates with India
const borderCoords: Record<string, [number, number]> = {
  'Myanmar': [24.1645, 93.9376],
  'Bangladesh': [23.8103, 89.9376],
  'Sri Lanka': [9.9312, 79.8612],
  'Afghanistan': [30.3753, 73.9376],
  'China': [34.1526, 77.5771],
  'Pakistan': [31.5204, 74.3587],
  'Bhutan': [26.8668, 89.3833],
  'Nepal': [27.7172, 85.3240],
};

const formatNumber = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
};

const Dashboard = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [apiConnected, setApiConnected] = useState(false);

  // Read latest year from local UN dataset
  const latestData = useMemo(() => {
    const validData = unData as RefugeeData[];
    if (validData.length === 0) return [];
    const latestYear = Math.max(...validData.map((d: RefugeeData) => d.year));
    return validData.filter((d: RefugeeData) => d.year === latestYear);
  }, []);


  // Total from historical UN data
  const totalFromData = useMemo(() => {
    return latestData.reduce((acc: number, curr: RefugeeData) => acc + (curr.refugees || 0), 0);
  }, [latestData]);

  const originsTracked = useMemo(() => {
    return latestData.filter((d: RefugeeData) => d.refugees > 0).length;
  }, [latestData]);

  // Fetch ML predictions for 2026
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await fetchWithCache('/api/predict-all?year=2026');
        setPredictions(data);
        setApiConnected(true);
      } catch {
        // Flask not running — that's fine, we still have UN data
      }
    };
    fetchPredictions();
  }, []);

  // Predicted totals from ML model (neighboring countries)
  const predictedTotals = useMemo(() => {
    const neighbors = predictions.filter(p => p.is_neighbor);
    return {
      refugees: neighbors.reduce((s, p) => s + p.refugees, 0),
      food: neighbors.reduce((s, p) => s + p.food, 0),
      shelter: neighbors.reduce((s, p) => s + p.shelter, 0),
      medical: neighbors.reduce((s, p) => s + p.medical, 0),
      water: neighbors.reduce((s, p) => s + p.water, 0),
    };
  }, [predictions]);

  // 12-month growth from UN data
  const [monthlyGrowth, setMonthlyGrowth] = useState<{year: number, total: number}[]>([]);
  
  useEffect(() => {
    const fetchGrowth = async () => {
      try {
        const data = await fetchWithCache('/api/series');
        // Filter for dashboard view (e.g. 2013-2026)
        setMonthlyGrowth(data.filter((d: any) => d.x >= 2013 && d.x <= 2026).map((d: any) => ({
          year: d.x,
          total: d.y
        })));
      } catch (err) {
        console.error('Error fetching growth:', err);
      }
    };
    fetchGrowth();
  }, []);



  return (
    <div className="p-4 sm:p-6 lg:p-12 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto w-full animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-background via-primary to-on-background dark:from-white dark:via-blue-400 dark:to-white bg-gradient-pan bg-[length:200%_auto]">India Displacement Monitor</h1>
          <p className="text-on-surface-variant dark:text-gray-400 mt-2 lg:mt-3 font-medium text-sm lg:text-lg leading-relaxed max-w-2xl">Predictive analysis of humanitarian movement into India from neighboring countries.</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Map */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest/80 dark:bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden editorial-shadow relative min-h-[350px] lg:min-h-[600px] flex flex-col group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1">
          <div className="p-4 lg:p-6 border-b border-outline-variant/10 dark:border-white/5 flex justify-between items-center glass-panel sticky top-0 z-10 absolute w-full">
            <h3 className="font-headline font-bold text-on-surface dark:text-white text-sm lg:text-base">Displacement Heatmap — 2026</h3>
          </div>

          <div className="flex-1 bg-surface-dim dark:bg-[#0d1520] relative overflow-hidden" style={{ minHeight: '300px', zIndex: 0 }}>
            <MapContainer center={[22.5937, 78.9629]} zoom={4} scrollWheelZoom={false} className="w-full h-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              {latestData.map((item: RefugeeData, idx: number) => {
                if (item.refugees > 0 && borderCoords[item.origin]) {
                  return (
                    <CircleMarker key={idx} center={borderCoords[item.origin]} radius={Math.max(10, Math.min(40, item.refugees / 2000))} color="transparent" fillColor={item.refugees > 50000 ? "#ba1a1a" : "#00288e"} fillOpacity={0.6}>
                      <Popup><strong>{item.origin}</strong><br/>Refugees (2026): {item.refugees.toLocaleString()}</Popup>
                    </CircleMarker>
                  );
                }
                return null;
              })}
            </MapContainer>

            {/* Map Legend */}
            <div className="absolute top-20 right-6 space-y-2" style={{ zIndex: 1000 }}>
              <div className="glass-panel py-2 px-4 rounded-full flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(0,40,142,0.5)]"></span>
                <span className="text-[10px] font-bold uppercase">&lt; 50K Refugees</span>
              </div>
              <div className="glass-panel py-2 px-4 rounded-full flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-error shadow-[0_0_8px_rgba(186,26,26,0.5)]"></span>
                <span className="text-[10px] font-bold uppercase">&gt; 50K Refugees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Side Panel */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Historical Total */}
          <div className="flex bg-surface-container-lowest/90 dark:bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:shadow-primary/5 transition-all duration-300 h-32 lg:h-36 border border-white/40 dark:border-white/10">
            <div className="w-1/3 bg-primary-container flex flex-col justify-center items-center text-on-primary-container p-3 lg:p-4">
              <span className="material-symbols-outlined text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              <span className="text-xs font-bold uppercase tracking-widest text-center leading-tight">Total Displaced</span>
            </div>
            <div className="w-2/3 p-4 lg:p-6 flex flex-col justify-center">
              <h4 className="font-headline font-black text-2xl lg:text-3xl text-on-background dark:text-white">{formatNumber(totalFromData)}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-on-surface-variant">UNHCR 2026 Data</span>
              </div>
            </div>
          </div>

          {/* Origins Tracked */}
          <div className="flex bg-surface-container-lowest dark:bg-white/5 rounded-xl overflow-hidden editorial-shadow h-32 lg:h-36 border border-white/40 dark:border-white/10">
            <div className="w-1/3 bg-tertiary-container flex flex-col justify-center items-center text-on-tertiary-container p-3 lg:p-4">
              <span className="material-symbols-outlined text-3xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>crisis_alert</span>
              <span className="text-xs font-bold uppercase tracking-widest text-center leading-tight">Origins Tracked</span>
            </div>
            <div className="w-2/3 p-4 lg:p-6 flex flex-col justify-center">
              <h4 className="font-headline font-black text-2xl lg:text-3xl text-on-background dark:text-white">{originsTracked}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-on-surface-variant">Active origin countries</span>
              </div>
            </div>
          </div>

          {/* Year-over-Year Growth */}
          <div className="bg-surface-container-lowest/90 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 lg:p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex-1 border border-white/40 dark:border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-headline font-bold text-on-surface dark:text-white">Year-over-Year Growth</h4>
                <p className="text-xs text-on-surface-variant">Total displacement by year</p>
              </div>
            </div>
            <div className="h-48 w-full flex items-end justify-between gap-1 mt-4 relative">
                {(() => {
                  if (monthlyGrowth.length === 0) return <div className="flex items-center justify-center h-full w-full text-on-surface-variant text-[10px]">Loading trend data...</div>;
                  
                  const totals = monthlyGrowth.map(g => g.total);
                  const max = Math.max(...totals, 1);
                  const min = Math.min(...totals);
                  // Use square root scaling consistent with Analysis page
                  const baseline = min * 0.9;
                  const range = max - baseline || 1;

                  return (
                    <div className="flex-1 h-full flex items-end justify-between gap-[1px] w-full relative pb-5">
                      {monthlyGrowth.map((g, i) => {
                        const rawPct = (g.total - baseline) / range;
                        const pct = Math.sqrt(Math.max(0, rawPct)) * 100;
                        const isLatest = i === monthlyGrowth.length - 1;
                        const isRecent = i === monthlyGrowth.length - 2;
                        const showLabel = i === 0 || i === Math.floor(monthlyGrowth.length / 2) || i === monthlyGrowth.length - 1;

                        return (
                          <div key={g.year} className="flex-1 h-full flex flex-col items-center justify-end relative group">
                            <div 
                              className={`w-full rounded-t-sm transition-all duration-700 ${
                                isLatest ? 'bg-primary shadow-[0_0_8px_rgba(0,40,142,0.3)]' : 
                                isRecent ? 'bg-primary/60' : 
                                'bg-primary/20 dark:bg-white/10'
                              }`}
                              style={{ height: `${Math.max(10, pct)}%` }}
                              title={`${g.year}: ${formatNumber(g.total)}`}
                            />
                            {showLabel && (
                              <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold whitespace-nowrap ${isLatest ? 'text-primary dark:text-blue-400' : 'text-on-surface-variant'}`}>
                                {g.year}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
            </div>
          </div>
        </div>

        {/* Bottom Row — ML Predictions Summary (only if Flask is connected) */}
        {apiConnected && (
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6">
            {[
              { label: '2026 Predicted Displaced', value: formatNumber(predictedTotals.refugees), icon: 'groups', color: 'border-primary', iconColor: 'text-primary' },
              { label: '2026 Food Required', value: formatNumber(predictedTotals.food), icon: 'restaurant', color: 'border-amber-500', iconColor: 'text-amber-600 dark:text-amber-400' },
              { label: '2026 Shelter Units', value: formatNumber(predictedTotals.shelter), icon: 'home', color: 'border-error', iconColor: 'text-error' },
              { label: '2026 Water Supply', value: formatNumber(predictedTotals.water), icon: 'water_drop', color: 'border-blue-500', iconColor: 'text-blue-500' },
            ].map(card => (
              <div key={card.label} className={`bg-surface-container-low/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-4 lg:p-6 border-l-4 ${card.color} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${card.iconColor} bg-white/50 dark:bg-white/5`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                  </div>
                  <h5 className="font-headline font-bold text-sm">{card.label}</h5>
                </div>
                <div className="text-2xl lg:text-3xl font-black text-on-surface dark:text-white">{card.value}</div>
                <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-wider">ML Prediction</p>
              </div>
            ))}
          </div>
        )}

        {/* Data Source Attribution */}
        <div className="col-span-12">
          <div className="bg-surface-container-low/40 dark:bg-white/3 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-sm">info</span>
            <p className="text-xs text-on-surface-variant">
              Historical data sourced from <strong>UNHCR Population Statistics</strong> (1981–2026). ML predictions powered by trained Random Forest models on {predictions.length > 0 ? predictions.length : 65} origin countries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
