import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Filter, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Info
} from 'lucide-react'
import Disclaimer from './Disclaimer'
import AIReportExplainer from './AIReportExplainer'

const PARAM_SIMPLE_HINTS = {
  'Hemoglobin': 'Oxygen-carrying protein in red blood cells that provides bodily energy',
  'RBC Count': 'Red blood cells that deliver oxygen to your brain and body',
  'WBC Count': 'White blood cells that fight off germs, bacteria, and infections',
  'Platelet Count': 'Cells that help your blood clot and heal cuts properly',
  'Hematocrit (HCT)': 'Percentage of your blood volume made up of red blood cells',
  'MCV': 'Average size of red blood cells (key marker for iron deficiency)',
  'MCH': 'Average amount of hemoglobin inside each red blood cell',
  'MCHC': 'Hemoglobin concentration inside your red blood cells',
  'RDW': 'Variation in the size of your red blood cells',
  'Total Bilirubin': 'Natural yellow pigment from red cells; key liver health marker',
  'Direct Bilirubin': 'Bilirubin processed by liver ready for digestion',
  'Indirect Bilirubin': 'Unprocessed bilirubin traveling to the liver',
  'ALT (SGPT)': 'Liver enzyme; rises when liver cells are irritated or stressed',
  'AST (SGOT)': 'Enzyme in liver and muscles; marks general tissue strain',
  'Alkaline Phosphatase (ALP)': 'Enzyme linked to liver bile ducts and bone health',
  'Albumin': 'Major blood protein made by liver; prevents fluid leaks into tissues',
  'Total Protein': 'Combined protein level circulating in your bloodstream',
  'Fasting Blood Glucose': 'Immediate blood sugar level after an overnight fast',
  'HbA1c': 'Your average blood sugar over the last 2 to 3 months',
  'Total Cholesterol': 'Total fats in blood combining protective and harmful types',
  'LDL Cholesterol': '"Bad" cholesterol; excess can build plaque in blood vessels',
  'HDL Cholesterol': '"Good" cholesterol; clears excess fat back to the liver',
  'Triglycerides': 'Fats stored from unused calories (sugar, oil, carbs)',
  'Creatinine': 'Waste product filtered by kidneys; key kidney health marker',
  'BUN (Blood Urea Nitrogen)': 'Protein waste product filtered out by kidneys',
  'eGFR': 'Estimated filtration speed of kidneys (higher is better)',
  'Uric Acid': 'Waste product from food breakdown; high levels link to gout',
  'TSH': 'Thyroid hormone controlling body energy and metabolism',
  'Vitamin D (25-OH)': 'Crucial nutrient for strong bones, immunity, and mood',
  'Vitamin B12': 'Essential for nerve function, brain clarity, and red cells',
  'Ferritin': 'Your body\'s reserve storage vault of iron',
  'C-Reactive Protein (CRP)': 'General marker of inflammation in the body',
  'Sodium': 'Electrolyte balancing body fluids and nerve signals',
  'Potassium': 'Electrolyte vital for healthy heartbeats and muscles',
  'Calcium': 'Mineral needed for strong bones, heart contractions, and nerves'
}

export default function BloodResultsView({ results, uploadedImage, navigate }) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const summary = results.summary || {}
  const parameters = results.parameters || []
  const conditions = results.conditions || []

  const healthScore = summary.healthScore ?? 75
  const abnormalCount = summary.abnormalCount ?? 0
  const normalCount = summary.normalCount ?? parameters.length
  const criticalCount = summary.criticalCount ?? 0
  const doctorNeeded = summary.doctorConsultationRecommended ?? (abnormalCount > 2)

  // Panels available
  const panels = useMemo(() => {
    const set = new Set()
    parameters.forEach(p => {
      if (p.panel) set.add(p.panel)
    })
    return Array.from(set)
  }, [parameters])

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter(param => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        param.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (param.panel && param.panel.toLowerCase().includes(searchQuery.toLowerCase()))

      if (!matchesSearch) return false

      // Category filter
      if (activeFilter === 'all') return true
      if (activeFilter === 'abnormal') return param.status !== 'NORMAL'
      return param.panel === activeFilter
    })
  }, [parameters, activeFilter, searchQuery])

  // Helper for status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'NORMAL':
        return <span className="status-chip status-chip-normal"><CheckCircle2 size={12} /> Normal</span>
      case 'LOW':
      case 'CRITICAL_LOW':
        return <span className="status-chip status-chip-low"><TrendingDown size={12} /> Low</span>
      case 'HIGH':
        return <span className="status-chip status-chip-high"><TrendingUp size={12} /> High</span>
      case 'CRITICAL_HIGH':
        return <span className="status-chip status-chip-critical"><AlertTriangle size={12} /> Critical High</span>
      default:
        return <span className="status-chip">{status}</span>
    }
  }

  // Calculate visual position on range slider (percentage 0 to 100)
  const calculateBarPosition = (val, low, high) => {
    if (val === undefined || val === null) return 50
    const numVal = Number(val)
    const numLow = Number(low)
    const numHigh = Number(high)

    if (isNaN(numVal)) return 50
    if (isNaN(numLow) || isNaN(numHigh) || numLow === numHigh) {
      return 50
    }

    // Normal zone will span from 25% to 75% on our visual track
    const span = numHigh - numLow
    if (numVal < numLow) {
      const underRatio = (numLow - numVal) / span
      const pos = 25 - (underRatio * 20)
      return Math.max(5, Math.min(24, pos))
    } else if (numVal > numHigh) {
      const overRatio = (numVal - numHigh) / span
      const pos = 75 + (overRatio * 20)
      return Math.max(76, Math.min(95, pos))
    } else {
      const inRatio = (numVal - numLow) / span
      return 25 + inRatio * 50
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="results-page" id="blood-results-view">
      <div className="container">
        {/* Navigation & Actions */}
        <motion.div
          className="results-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <button 
              onClick={() => navigate('/blood')}
              className="btn btn-secondary btn-sm"
              id="back-to-blood-upload"
            >
              <ArrowLeft size={16} />
              New Analysis
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handlePrint}
                className="btn btn-secondary btn-sm" 
                id="print-blood-report"
              >
                <Download size={16} />
                Export / Print Report
              </button>
              <Link 
                to="/blood" 
                className="btn btn-secondary btn-sm"
                id="try-another-blood"
              >
                <RotateCcw size={16} />
                Analyze Another
              </Link>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px', 
            marginBottom: '16px' 
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
            }}>
              <FileText size={24} />
            </div>
          </div>

          <h1 className="text-h1">
            <span className="text-gradient-blood">Blood Test Report</span> Analysis
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span className={`status-badge ${abnormalCount === 0 ? 'status-badge-success' : 'status-badge-warning'}`}>
              <CheckCircle2 size={12} />
              {summary.overallStatus || (abnormalCount === 0 ? 'Normal Profile' : 'Abnormalities Flagged')}
            </span>
            {results.processingTime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                <Clock size={14} />
                Processed in {results.processingTime}
              </span>
            )}
          </div>
        </motion.div>

        {/* Top KPI Cards */}
        <div className="blood-kpi-grid">
          {/* Health Score */}
          <div className="blood-kpi-card blood-kpi-score">
            <div className="blood-kpi-label">Overall Health Score</div>
            <div className="blood-kpi-value text-gradient-blood">
              {healthScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: healthScore >= 80 ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}>
              {healthScore >= 85 ? 'Healthy Standard Ranges' : healthScore >= 70 ? 'Mild Multi-Parameter Variance' : 'Actionable Clinical Markers'}
            </div>
          </div>

          {/* Flagged Abnormalities */}
          <div className="blood-kpi-card blood-kpi-abnormal">
            <div className="blood-kpi-label">Tests Outside Normal</div>
            <div className="blood-kpi-value" style={{ color: 'var(--accent-amber)' }}>
              {abnormalCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Tests outside standard adult baseline
            </div>
          </div>

          {/* Normal Parameters */}
          <div className="blood-kpi-card blood-kpi-normal">
            <div className="blood-kpi-label">Normal Range</div>
            <div className="blood-kpi-value" style={{ color: 'var(--accent-cyan)' }}>
              {normalCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Parameters within reference intervals
            </div>
          </div>

          {/* High Acuity Flags */}
          <div className="blood-kpi-card blood-kpi-critical">
            <div className="blood-kpi-label">Needs Attention</div>
            <div className="blood-kpi-value" style={{ color: criticalCount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {criticalCount > 0 ? 'Priority doctor review' : 'No critical emergencies flagged'}
            </div>
          </div>
        </div>

        {/* Beginner Plain-English Summary Box */}
        <div style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(45, 212, 191, 0.04)',
          border: '1px solid rgba(45, 212, 191, 0.25)',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <Sparkles size={24} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              What Your Report Means (In Everyday Words)
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {abnormalCount === 0 
                ? "Great news! All tested lab markers fall within typical adult ranges. Keep up your balanced nutrition, good sleep, and healthy habits."
                : `We identified ${abnormalCount} test ${abnormalCount === 1 ? 'number' : 'numbers'} outside standard adult guidelines. These variances often respond well to simple dietary, hydration, or lifestyle adjustments. Review our AI summary below and bring this report to your doctor.`}
            </p>
          </div>
        </div>

        {/* Doctor Consultation Banner */}
        {doctorNeeded && (
          <motion.div 
            className="blood-doctor-banner"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Stethoscope size={28} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Physician Consultation Recommended
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                One or more of your laboratory test values deviate from standard reference intervals. 
                Correlated patterns such as {conditions.slice(0, 2).map(c => c.condition).join(' and ')} warrant 
                clinical evaluation by your primary physician or specialist for proper dietary guidance, follow-up tests, or treatment.
              </p>
            </div>
          </motion.div>
        )}

        {/* AI Clinical Report Explainer & Assistant */}
        <AIReportExplainer reportData={results} module="blood" />

        {/* Main Content Grid: Correlated Conditions & Detailed Parameters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(360px, 1.4fr)', gap: '32px' }} className="blood-main-grid">
          
          {/* Left Column: Correlated Patterns */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <HeartPulse size={20} style={{ color: 'var(--accent-rose)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                Correlated Clinical Patterns ({conditions.length})
              </h3>
            </div>

            {conditions.length === 0 ? (
              <div className="glass-card-static" style={{ padding: '24px', textAlign: 'center' }}>
                <CheckCircle2 size={36} style={{ color: 'var(--accent-cyan)', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>All Parameters Normal</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  No correlated pathological patterns detected in the analyzed lab parameters.
                </p>
              </div>
            ) : (
              conditions.map((item, idx) => (
                <motion.div
                  key={item.condition}
                  className="blood-condition-item"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.condition}
                    </h4>
                    <span 
                      className="format-badge"
                      style={{ 
                        color: (item.likelihood === 'High' || item.severity === 'High') ? 'var(--accent-rose)' : 'var(--accent-amber)',
                        borderColor: (item.likelihood === 'High' || item.severity === 'High') ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'
                      }}
                    >
                      {item.likelihood ? `${item.likelihood} Likelihood` : `${item.severity || 'Moderate'} Acuity`}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                    {item.rationale || item.recommendation}
                  </p>

                  {(item.primaryIndicators || item.evidence) && (item.primaryIndicators || item.evidence).length > 0 && (
                    <div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Clinical Evidence:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {(item.primaryIndicators || item.evidence).map(marker => (
                          <span key={marker} className="indicator-pill">
                            {marker}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}

            {/* Extracted Document Context */}
            {uploadedImage && uploadedImage !== 'pdf-document' && (
              <div className="glass-card-static" style={{ marginTop: '24px', padding: '20px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Source Document Scan
                </h4>
                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '280px', border: '1px solid var(--border-color)' }}>
                  <img 
                    src={uploadedImage} 
                    alt="Blood report scan preview" 
                    style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Laboratory Parameters Benchmarking */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} style={{ color: 'var(--accent-amber)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                  Benchmarked Lab Parameters ({filteredParameters.length})
                </h3>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search test name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="blood-filter-tabs">
              <button 
                type="button"
                className={`blood-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All Tests ({parameters.length})
              </button>
              <button 
                type="button"
                className={`blood-filter-tab ${activeFilter === 'abnormal' ? 'active' : ''}`}
                onClick={() => setActiveFilter('abnormal')}
              >
                Abnormal ({abnormalCount})
              </button>
              {panels.map(panel => (
                <button
                  key={panel}
                  type="button"
                  className={`blood-filter-tab ${activeFilter === panel ? 'active' : ''}`}
                  onClick={() => setActiveFilter(panel)}
                >
                  {panel.replace('Complete Blood Count ', '').replace('Test ', '')}
                </button>
              ))}
            </div>

            {/* Parameter Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredParameters.length === 0 ? (
                <div className="glass-card-static" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No laboratory tests match the selected filter.
                </div>
              ) : (
                filteredParameters.map((param) => {
                  const barPos = calculateBarPosition(param.value, param.refLow, param.refHigh)
                  const pinClass = param.status === 'NORMAL' 
                    ? 'normal' 
                    : param.status === 'LOW' || param.status === 'CRITICAL_LOW' 
                    ? 'low' 
                    : param.status === 'CRITICAL_HIGH' 
                    ? 'critical' 
                    : 'high'

                  return (
                    <motion.div
                      key={param.canonicalName}
                      className="glass-card-static"
                      style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {param.canonicalName}
                            </span>
                            {param.panel && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                • {param.panel}
                              </span>
                            )}
                          </div>
                          {PARAM_SIMPLE_HINTS[param.canonicalName] && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '2px', fontWeight: 500 }}>
                              💡 {PARAM_SIMPLE_HINTS[param.canonicalName]}
                            </div>
                          )}
                        </div>
                        {getStatusBadge(param.status)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '6px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: param.status === 'NORMAL' ? 'var(--text-primary)' : 'var(--accent-amber)' }}>
                          {param.value} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>{param.unit}</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          Standard Reference: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{param.refLow} – {param.refHigh} {param.unit}</span>
                        </div>
                      </div>

                      {/* Visual Range Indicator Bar */}
                      <div className="range-bar-container">
                        <div className="range-bar-track">
                          {/* Normal Zone (25% to 75%) */}
                          <div className="range-bar-normal-zone" style={{ left: '25%', width: '50%' }} />
                          {/* Value Pin */}
                          <div 
                            className={`range-bar-pin ${pinClass}`} 
                            style={{ left: `${barPos}%` }}
                            title={`Observed Value: ${param.value} ${param.unit}`}
                          />
                        </div>
                        <div className="range-bar-labels">
                          <span>Low (&lt;{param.refLow})</span>
                          <span style={{ color: 'var(--accent-cyan)' }}>Normal ({param.refLow} – {param.refHigh})</span>
                          <span>High (&gt;{param.refHigh})</span>
                        </div>
                      </div>

                      {param.significance && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
                          Clinical significance: {param.significance}
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Educational Info Box */}
        <motion.div
          style={{ maxWidth: '1200px', margin: '36px auto 0' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle size={20} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '6px' }}>
                  Understanding Your Blood Report Analysis
                </h4>
                <p className="text-small" style={{ lineHeight: 1.7 }}>
                  Laboratory reference ranges reflect 95% of healthy individuals within standard adult cohorts.
                  Isolated minor deviations may result from circadian rhythms, recent exercise, dietary changes, or mild dehydration.
                  However, combinations of abnormal tests (e.g. low hemoglobin with low MCV and low ferritin) represent clinically 
                  meaningful patterns that should always be reviewed with a registered healthcare practitioner.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Medical Disclaimer */}
        <div className="container-narrow" style={{ marginTop: '32px' }}>
          <Disclaimer />
        </div>

        {/* Action Buttons */}
        <motion.div
          style={{ textAlign: 'center', marginTop: '48px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link 
            to="/blood" 
            className="btn btn-blood btn-lg"
            id="new-blood-analysis-btn"
          >
            <RotateCcw size={18} />
            Start New Blood Analysis
          </Link>
          <Link 
            to="/" 
            className="btn btn-secondary btn-lg" 
            style={{ marginLeft: '12px' }}
            id="blood-go-home-btn"
          >
            Back to Home
            <ChevronRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
