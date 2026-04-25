import { useEffect, useState, useMemo } from 'react';
import { getEndpoint } from '../config/api';

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

const Predictions = () => {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [predictionYear, setPredictionYear] = useState(2026);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch predictions from Flask backend
  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(getEndpoint(`/api/predict-all?year=${predictionYear}`));
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();
        setPredictions(data);
      } catch (err: any) {
        console.error('Flask API error:', err);
        setError('Could not connect to prediction server. Make sure Flask is running on port 5000.');
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, [predictionYear]);

  // Aggregate totals
  const totals = useMemo(() => {
    const neighborData = predictions.filter(p => NEIGHBOR_COUNTRIES.includes(p.country));
    return {
      totalRefugees: neighborData.reduce((sum, p) => sum + p.refugees, 0),
      totalFood: neighborData.reduce((sum, p) => sum + p.food, 0),
      totalShelter: neighborData.reduce((sum, p) => sum + p.shelter, 0),
      totalMedical: neighborData.reduce((sum, p) => sum + p.medical, 0),
      totalWater: neighborData.reduce((sum, p) => sum + p.water, 0),
      countriesTracked: neighborData.length,
    };
  }, [predictions]);

  // Filter predictions based on search or selected country
  const displayedPredictions = useMemo(() => {
    if (selectedCountry) {
      return predictions.filter(p => p.country === selectedCountry);
    }
    if (searchQuery.trim()) {
      return predictions.filter(p =>
        p.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    // Default: show neighboring countries
    return predictions.filter(p => NEIGHBOR_COUNTRIES.includes(p.country));
  }, [predictions, searchQuery, selectedCountry]);

  // Country list for dropdown
  const filteredCountryList = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return predictions
      .map(p => p.country)
      .filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 12);
  }, [predictions, searchQuery]);

  // Combined Trajectory (Historical + Predicted) from API
  const [historicalSeries, setHistoricalSeries] = useState<{x: number, y: number}[]>([]);
  
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const url = getEndpoint(selectedCountry ? `/api/series?country=${encodeURIComponent(selectedCountry)}` : '/api/series');
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setHistoricalSeries(data);
        }
      } catch (err) {
        console.error('Error fetching series:', err);
      }
    };
    fetchSeries();
  }, [selectedCountry]);

  // Selected country detail
  const selectedDetail = useMemo(() => {
    if (!selectedCountry) return null;
    return predictions.find(p => p.country === selectedCountry) || null;
  }, [selectedCountry, predictions]);

  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setSearchQuery(country);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedCountry(null);
    setSearchQuery('');
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-8 bg-transparent">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-fade-in-up">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-background via-primary to-on-background dark:from-white dark:via-blue-400 dark:to-white bg-gradient-pan bg-[length:200%_auto]">
              Displacement Predictions
            </h1>
            <p className="text-on-surface-variant dark:text-gray-400 font-medium text-sm lg:text-base max-w-2xl mt-2">
              ML-powered forecasts using trained models on UNHCR historical data (65 origin countries, 1964–2030).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Year</label>
            <select
              value={predictionYear}
              onChange={e => setPredictionYear(Number(e.target.value))}
              className="bg-surface-container-low dark:bg-white/5 border border-outline-variant/30 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-on-surface dark:text-white focus:ring-2 focus:ring-primary/30 outline-none transition-all"
            >
              {Array.from({length: 2030 - 1964 + 1}, (_, i) => 1964 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <div>
              <p className="font-bold text-sm">{error}</p>
              <p className="text-xs mt-1 opacity-80">Run: <code className="bg-black/10 px-2 py-0.5 rounded">python app.py</code> in Kiran's prediction system folder</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
              <span className="text-sm font-bold text-on-surface-variant">Loading predictions from ML model...</span>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Global Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
              {[
                { label: 'Total Displaced', value: formatNumber(totals.totalRefugees), icon: 'groups', color: 'text-primary dark:text-blue-400' },
                { label: 'Food Required', value: formatNumber(totals.totalFood), icon: 'restaurant', color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Shelter Units', value: formatNumber(totals.totalShelter), icon: 'home', color: 'text-error' },
                { label: 'Medical Kits', value: formatNumber(totals.totalMedical), icon: 'medical_services', color: 'text-secondary' },
                { label: 'Water Supply', value: formatNumber(totals.totalWater), icon: 'water_drop', color: 'text-blue-500' },
                { label: 'Countries', value: totals.countriesTracked.toString(), icon: 'public', color: 'text-on-surface-variant' },
              ].map(card => (
                <div key={card.label} className="bg-surface-container-lowest/80 dark:bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/40 dark:border-white/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-lg ${card.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                  </div>
                  <div className="text-xl lg:text-2xl font-black text-on-surface dark:text-white">{card.value}</div>
                  <div className="text-[10px] font-bold text-on-surface-variant dark:text-gray-500 uppercase tracking-wider mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="flex items-center bg-surface-container-lowest/80 dark:bg-white/5 backdrop-blur-md rounded-xl px-4 py-3 border border-outline-variant/30 dark:border-white/10 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
                <span className="material-symbols-outlined text-on-surface-variant dark:text-gray-500 mr-3">search</span>
                <input
                  className="bg-transparent border-none outline-none focus:ring-0 text-sm font-medium text-on-surface dark:text-white w-full placeholder-outline dark:placeholder-gray-600"
                  placeholder="Search any country (e.g. Afghanistan, Myanmar, Sri Lanka...)"
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setSelectedCountry(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {selectedCountry && (
                  <button onClick={handleClearSelection} className="ml-2 p-1 rounded-full hover:bg-surface-container-high dark:hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && filteredCountryList.length > 0 && !selectedCountry && (
                <div className="absolute z-30 top-full mt-1 w-full bg-surface-container-lowest dark:bg-[#111827] border border-outline-variant/20 dark:border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                  {filteredCountryList.map(country => (
                    <button
                      key={country}
                      onClick={() => handleSelectCountry(country)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-sm">flag</span>
                      {country}
                      {NEIGHBOR_COUNTRIES.includes(country) && (
                        <span className="ml-auto text-[10px] font-bold text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-400/10 px-2 py-0.5 rounded-full">Neighbor</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Country Detail */}
            {selectedDetail && (
              <div className="bg-surface-container-lowest/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 lg:p-8 border border-white/40 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-headline text-2xl lg:text-3xl font-black text-on-surface dark:text-white">{selectedDetail.country}</h2>
                    <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">Predicted displacement into India for {selectedDetail.year}</p>
                  </div>
                  {selectedDetail.is_neighbor && (
                    <span className="text-xs font-bold text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-400/10 px-3 py-1 rounded-full">Neighboring Country</span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: 'Refugees', value: selectedDetail.refugees, icon: 'groups', color: 'bg-primary/10 text-primary dark:text-blue-400' },
                    { label: 'Food', value: selectedDetail.food, icon: 'restaurant', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
                    { label: 'Shelter', value: selectedDetail.shelter, icon: 'home', color: 'bg-error/10 text-error' },
                    { label: 'Medical', value: selectedDetail.medical, icon: 'medical_services', color: 'bg-secondary/10 text-secondary' },
                    { label: 'Water', value: selectedDetail.water, icon: 'water_drop', color: 'bg-blue-500/10 text-blue-500' },
                  ].map(item => (
                    <div key={item.label} className="bg-surface-container-low dark:bg-white/5 rounded-xl p-4 text-center">
                      <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mx-auto mb-2`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      </div>
                      <div className="text-xl lg:text-2xl font-black text-on-surface dark:text-white">{formatNumber(item.value)}</div>
                      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Displacement Table */}
            <div className="bg-surface-container-lowest/80 dark:bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 dark:border-white/10">
              <div className="p-4 lg:p-6 border-b border-outline-variant/10 dark:border-white/5">
                <h3 className="font-headline font-bold text-lg text-on-surface dark:text-white">
                  {selectedCountry ? `${selectedCountry} — Detailed Prediction` : 'Neighboring Countries — Displacement Overview'}
                </h3>
                <p className="text-xs text-on-surface-variant dark:text-gray-500 mt-1">
                  Predicted refugee counts and resource requirements for {predictionYear}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-outline-variant/10 dark:border-white/5">
                      <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-on-surface-variant dark:text-gray-500 uppercase tracking-widest">Country</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-on-surface-variant dark:text-gray-500 uppercase tracking-widest text-right">Refugees</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-on-surface-variant dark:text-gray-500 uppercase tracking-widest text-right">Food</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-on-surface-variant dark:text-gray-500 uppercase tracking-widest text-right">Shelter</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-on-surface-variant dark:text-gray-500 uppercase tracking-widest text-right">Medical</th>
                      <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-on-surface-variant dark:text-gray-500 uppercase tracking-widest text-right">Water</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5 dark:divide-white/5">
                    {displayedPredictions.map(p => (
                      <tr
                        key={p.country}
                        className="hover:bg-surface-container-low dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handleSelectCountry(p.country)}
                      >
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant text-sm">flag</span>
                            <span className="text-sm font-bold text-on-surface dark:text-white">{p.country}</span>
                            {p.is_neighbor && (
                              <span className="text-[9px] font-bold text-primary dark:text-blue-400 bg-primary/10 dark:bg-blue-400/10 px-1.5 py-0.5 rounded">N</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm font-bold text-on-surface dark:text-white text-right">{p.refugees.toLocaleString()}</td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-amber-600 dark:text-amber-400 font-medium text-right">{p.food.toLocaleString()}</td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-error font-medium text-right">{p.shelter.toLocaleString()}</td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-secondary font-medium text-right">{p.medical.toLocaleString()}</td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-blue-500 font-medium text-right">{p.water.toLocaleString()}</td>
                      </tr>
                    ))}
                    {displayedPredictions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant text-sm">No countries match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Trajectory */}
            <div className="bg-surface-container-lowest/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-6 lg:p-10 border border-white/40 dark:border-white/10">
              <div className="flex justify-between items-end mb-8 border-b border-outline-variant/20 dark:border-white/5 pb-4">
                <div>
                  <h3 className="font-headline text-xl lg:text-2xl font-black tracking-tight text-on-surface dark:text-white">
                    Historical & Predicted Trajectory {selectedCountry ? `— ${selectedCountry}` : '— All Origins'}
                  </h3>
                  <p className="text-on-surface-variant dark:text-gray-400 font-medium text-sm mt-1">
                    UNHCR historical data blended with ML forecasts, {historicalSeries.length > 0 ? `${historicalSeries[0].x}–2030` : '2000–2030'}
                  </p>
                </div>
              </div>

              <div className="w-full relative mt-4 h-48 lg:h-56">
                {(() => {
                  // Filter out countries with insufficient data (e.g. less than 3 data points)
                  if (historicalSeries.length < 3) {
                    return <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">Insufficient data points to plot trajectory.</div>;
                  }

                  const maxVal = Math.max(...historicalSeries.map(s => s.y));
                  const minVal = Math.max(0, Math.min(...historicalSeries.map(s => s.y)) * 0.9);
                  const range = maxVal - minVal || 1;

                  const points = historicalSeries.map((p, i) => {
                    const x = (i / (historicalSeries.length - 1)) * 1000;
                    const y = 200 - (((p.y - minVal) / range) * 180);
                    return { x, y, orig: p };
                  });

                  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');
                  const polygonStr = `0,200 ${polylineStr} 1000,200`;

                  return (
                    <>
                      <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#00288e" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#00288e" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <polygon points={polygonStr} fill="url(#areaGrad)" />
                        <polyline points={polylineStr} fill="none" stroke="#00288e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {points.map((p, idx) => (
                          <g key={`pt-${idx}`} className="group/pt cursor-crosshair">
                            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#00288e" strokeWidth="2.5" />
                            <circle cx={p.x} cy={p.y} r="18" fill="transparent" />
                            <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#00288e" fontSize="13" fontWeight="bold" className="opacity-0 group-hover/pt:opacity-100 transition-opacity">
                              {p.orig.y.toLocaleString()}
                            </text>
                          </g>
                        ))}
                      </svg>
                      <div className="flex justify-between w-full absolute -bottom-5 left-0">
                        {historicalSeries.map((p, i) => (
                          i % Math.max(1, Math.floor(historicalSeries.length / 10)) === 0 || i === historicalSeries.length - 1 ? (
                            <span key={`lbl-${p.x}`} className="text-[10px] font-bold text-outline-variant dark:text-gray-500">{p.x}</span>
                          ) : null
                        )).filter(Boolean)}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Predictions;
