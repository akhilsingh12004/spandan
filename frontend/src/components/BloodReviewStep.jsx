import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  FileText, 
  Sparkles, 
  ArrowLeft, 
  Info, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  ChevronDown,
  RotateCcw
} from 'lucide-react'

// Reference list of standard canonical parameters for autocomplete
const STANDARD_TESTS = [
  { name: 'Hemoglobin', panel: 'Complete Blood Count (CBC)', unit: 'g/dL', min: 12.0, max: 17.5 },
  { name: 'WBC Count', panel: 'Complete Blood Count (CBC)', unit: '/mcL', min: 4000, max: 11000 },
  { name: 'RBC Count', panel: 'Complete Blood Count (CBC)', unit: 'M/mcL', min: 4.0, max: 5.9 },
  { name: 'Platelet Count', panel: 'Complete Blood Count (CBC)', unit: '/mcL', min: 150000, max: 450000 },
  { name: 'Hematocrit (HCT)', panel: 'Complete Blood Count (CBC)', unit: '%', min: 36.0, max: 50.0 },
  { name: 'MCV', panel: 'Complete Blood Count (CBC)', unit: 'fL', min: 80.0, max: 100.0 },
  { name: 'MCH', panel: 'Complete Blood Count (CBC)', unit: 'pg', min: 27.0, max: 33.0 },
  { name: 'MCHC', panel: 'Complete Blood Count (CBC)', unit: 'g/dL', min: 32.0, max: 36.0 },
  { name: 'RDW', panel: 'Complete Blood Count (CBC)', unit: '%', min: 11.5, max: 14.5 },
  { name: 'Total Cholesterol', panel: 'Lipid Profile', unit: 'mg/dL', min: 100.0, max: 200.0 },
  { name: 'LDL Cholesterol', panel: 'Lipid Profile', unit: 'mg/dL', min: 0.0, max: 100.0 },
  { name: 'HDL Cholesterol', panel: 'Lipid Profile', unit: 'mg/dL', min: 40.0, max: 80.0 },
  { name: 'Triglycerides', panel: 'Lipid Profile', unit: 'mg/dL', min: 0.0, max: 150.0 },
  { name: 'Fasting Blood Glucose', panel: 'Blood Sugar & Glycemic', unit: 'mg/dL', min: 70.0, max: 99.0 },
  { name: 'HbA1c', panel: 'Blood Sugar & Glycemic', unit: '%', min: 4.0, max: 5.6 },
  { name: 'Total Bilirubin', panel: 'Liver Function Test (LFT)', unit: 'mg/dL', min: 0.2, max: 1.2 },
  { name: 'Direct Bilirubin', panel: 'Liver Function Test (LFT)', unit: 'mg/dL', min: 0.0, max: 0.3 },
  { name: 'ALT (SGPT)', panel: 'Liver Function Test (LFT)', unit: 'U/L', min: 7.0, max: 56.0 },
  { name: 'AST (SGOT)', panel: 'Liver Function Test (LFT)', unit: 'U/L', min: 10.0, max: 40.0 },
  { name: 'Alkaline Phosphatase (ALP)', panel: 'Liver Function Test (LFT)', unit: 'U/L', min: 44.0, max: 147.0 },
  { name: 'Creatinine', panel: 'Kidney Function Test (KFT)', unit: 'mg/dL', min: 0.6, max: 1.3 },
  { name: 'Blood Urea Nitrogen (BUN)', panel: 'Kidney Function Test (KFT)', unit: 'mg/dL', min: 7.0, max: 20.0 },
  { name: 'TSH', panel: 'Thyroid Panel', unit: 'mIU/L', min: 0.4, max: 4.5 },
  { name: 'Free T4', panel: 'Thyroid Panel', unit: 'ng/dL', min: 0.8, max: 1.8 },
  { name: 'Potassium', panel: 'Electrolytes', unit: 'mEq/L', min: 3.5, max: 5.0 },
  { name: 'Sodium', panel: 'Electrolytes', unit: 'mEq/L', min: 135.0, max: 145.0 },
  { name: 'Vitamin D (25-OH)', panel: 'Vitamins & Minerals', unit: 'ng/mL', min: 30.0, max: 100.0 },
  { name: 'Vitamin B12', panel: 'Vitamins & Minerals', unit: 'pg/mL', min: 200.0, max: 900.0 },
  { name: 'C-Reactive Protein (CRP)', panel: 'Inflammation Markers', unit: 'mg/L', min: 0.0, max: 3.0 },
  { name: 'ESR', panel: 'Inflammation Markers', unit: 'mm/hr', min: 0.0, max: 20.0 },
]

export default function BloodReviewStep({
  initialParameters = [],
  rawText = '',
  imagePreview = null,
  patientContext = null,
  onConfirm,
  onBack,
  isLoading = false,
}) {
  const [params, setParams] = useState(() => {
    if (initialParameters && initialParameters.length > 0) {
      return initialParameters.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        canonicalName: p.canonicalName || p.name || '',
        value: p.value !== undefined ? String(p.value) : '',
        unit: p.unit || '',
        panel: p.panel || 'Other',
        min: p.refLow ?? p.min,
        max: p.refHigh ?? p.max,
      }))
    }
    return [
      { id: '1', canonicalName: 'Hemoglobin', value: '12.5', unit: 'g/dL', panel: 'Complete Blood Count (CBC)', min: 12.0, max: 17.5 },
      { id: '2', canonicalName: 'Total Cholesterol', value: '190', unit: 'mg/dL', panel: 'Lipid Profile', min: 100.0, max: 200.0 },
    ]
  })

  const [showDocPreview, setShowDocPreview] = useState(false)
  const [newTestName, setNewTestName] = useState('')

  // Quick evaluation of status for a parameter row
  const getParamStatus = (p) => {
    const val = parseFloat(p.value)
    if (isNaN(val)) return { label: 'Incomplete', color: 'var(--text-tertiary)' }
    if (p.min !== undefined && p.min !== null && val < p.min) {
      return { label: 'Low', color: 'var(--accent-amber)' }
    }
    if (p.max !== undefined && p.max !== null && val > p.max) {
      return { label: 'High', color: 'var(--accent-coral)' }
    }
    return { label: 'Normal', color: 'var(--accent-teal)' }
  }

  const handleValueChange = (id, newVal) => {
    setParams(prev => prev.map(p => p.id === id ? { ...p, value: newVal } : p))
  }

  const handleRemoveRow = (id) => {
    setParams(prev => prev.filter(p => p.id !== id))
  }

  const handleAddPredefined = (testName) => {
    const found = STANDARD_TESTS.find(t => t.name === testName)
    if (!found) return
    if (params.some(p => p.canonicalName.toLowerCase() === testName.toLowerCase())) {
      return // Already present
    }
    setParams(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        canonicalName: found.name,
        value: '',
        unit: found.unit,
        panel: found.panel,
        min: found.min,
        max: found.max,
      }
    ])
    setNewTestName('')
  }

  const handleAddCustom = () => {
    setParams(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        canonicalName: '',
        value: '',
        unit: '',
        panel: 'Other',
        min: null,
        max: null,
      }
    ])
  }

  const handleResetToExtracted = () => {
    if (initialParameters && initialParameters.length > 0) {
      setParams(initialParameters.map(p => ({
        id: Math.random().toString(36).substr(2, 9),
        canonicalName: p.canonicalName || p.name || '',
        value: p.value !== undefined ? String(p.value) : '',
        unit: p.unit || '',
        panel: p.panel || 'Other',
        min: p.refLow ?? p.min,
        max: p.refHigh ?? p.max,
      })))
    }
  }

  const handleSubmit = () => {
    const cleanDict = {}
    params.forEach(p => {
      const name = p.canonicalName.trim()
      const val = parseFloat(p.value)
      if (name && !isNaN(val)) {
        cleanDict[name] = val
      }
    })
    onConfirm(cleanDict)
  }

  // Count abnormal preview
  const abnormalCount = useMemo(() => {
    return params.filter(p => {
      const st = getParamStatus(p)
      return st.label === 'Low' || st.label === 'High'
    }).length
  }, [params])

  return (
    <div className="blood-review-wrapper" style={{ marginTop: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(20, 184, 166, 0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(20, 184, 166, 0.15)',
                color: 'var(--accent-teal)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={14} /> Step 2 of 2: Review & Verification
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px'
              }}>
                {params.length} parameters identified
              </span>
            </div>
            <h2 className="text-h3" style={{ margin: '0 0 6px 0' }}>
              Confirm Extracted Test Values
            </h2>
            <p className="text-secondary" style={{ fontSize: '14px', margin: 0, maxWidth: '640px' }}>
              Ensure every value and decimal place matches your physical or PDF laboratory report. 
              You can correct numbers, delete misrecognized lines, or add missing tests.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {imagePreview && (
              <button
                type="button"
                onClick={() => setShowDocPreview(!showDocPreview)}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '13px' }}
              >
                {showDocPreview ? <EyeOff size={15} /> : <Eye size={15} />}
                {showDocPreview ? 'Hide Document' : 'View Document'}
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToExtracted}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '13px' }}
              title="Reset back to initial OCR extraction"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
        </div>

        {/* Patient Context Chip Bar */}
        {patientContext && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Patient Profile:</span>
            {patientContext.age && <span>Age: <strong>{patientContext.age}</strong></span>}
            {patientContext.sex && <span>Sex: <strong>{patientContext.sex}</strong></span>}
            {patientContext.fasting && <span>Status: <strong>{patientContext.fasting}</strong></span>}
            {patientContext.symptoms && <span>Symptoms: <strong style={{ color: 'var(--accent-amber)' }}>{patientContext.symptoms}</strong></span>}
          </div>
        )}
      </div>

      {/* Side-by-side Document Preview (if toggled) */}
      <AnimatePresence>
        {showDocPreview && imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden',
              marginBottom: '24px',
              background: 'var(--surface-primary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              padding: '16px',
              textAlign: 'center'
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
              Reference uploaded document to verify extracted figures:
            </p>
            {imagePreview === 'pdf-document' ? (
              <div style={{ padding: '32px', color: 'var(--text-secondary)', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)' }}>
                <FileText size={48} style={{ color: 'var(--accent-teal)', marginBottom: '8px' }} />
                <p>Digital PDF Document loaded for extraction</p>
              </div>
            ) : (
              <img 
                src={imagePreview} 
                alt="Uploaded Report" 
                style={{ 
                  maxHeight: '400px', 
                  maxWidth: '100%', 
                  borderRadius: 'var(--radius-md)',
                  objectFit: 'contain',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parameters Table Card */}
      <div style={{
        background: 'var(--surface-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-secondary)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Verified Parameters List</span>
            {abnormalCount > 0 && (
              <span style={{
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--accent-coral)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {abnormalCount} out of reference
              </span>
            )}
          </div>

          {/* Quick Predefined Add Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={newTestName}
              onChange={(e) => {
                if (e.target.value) handleAddPredefined(e.target.value)
              }}
              className="form-input"
              style={{ fontSize: '13px', padding: '6px 12px', minWidth: '220px', height: '36px' }}
            >
              <option value="">+ Add standard test...</option>
              {STANDARD_TESTS.map(t => (
                <option 
                  key={t.name} 
                  value={t.name}
                  disabled={params.some(p => p.canonicalName.toLowerCase() === t.name.toLowerCase())}
                >
                  {t.name} ({t.unit})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleAddCustom}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '13px', height: '36px' }}
            >
              <Plus size={14} /> Custom
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-tertiary)', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px', width: '38%' }}>Test Parameter</th>
                <th style={{ padding: '12px 16px', width: '22%' }}>Measured Value</th>
                <th style={{ padding: '12px 16px', width: '15%' }}>Unit</th>
                <th style={{ padding: '12px 16px', width: '15%' }}>Standard Range</th>
                <th style={{ padding: '12px 16px', width: '10%', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {params.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No parameters listed. Click "+ Add standard test" or "+ Custom" above.
                  </td>
                </tr>
              ) : (
                params.map((p) => {
                  const status = getParamStatus(p)
                  return (
                    <tr 
                      key={p.id}
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Name Column */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <input
                            type="text"
                            value={p.canonicalName}
                            onChange={(e) => {
                              const val = e.target.value
                              setParams(prev => prev.map(item => item.id === p.id ? { ...item, canonicalName: val } : item))
                            }}
                            placeholder="e.g. Hemoglobin"
                            className="form-input"
                            style={{ 
                              padding: '6px 10px', 
                              fontSize: '14px', 
                              fontWeight: 600,
                              background: 'transparent',
                              border: '1px solid transparent'
                            }}
                            onFocus={(e) => e.target.style.background = 'var(--surface-secondary)'}
                            onBlur={(e) => e.target.style.background = 'transparent'}
                          />
                          {p.panel && (
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '10px' }}>
                              {p.panel}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Value Input */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            step="any"
                            value={p.value}
                            onChange={(e) => handleValueChange(p.id, e.target.value)}
                            placeholder="0.0"
                            className="form-input"
                            style={{ 
                              width: '110px', 
                              padding: '6px 10px', 
                              fontWeight: 700, 
                              fontSize: '15px',
                              borderColor: status.color !== 'var(--accent-teal)' && status.label !== 'Incomplete' ? status.color : undefined
                            }}
                          />
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: status.color,
                            background: `${status.color}18`,
                            whiteSpace: 'nowrap'
                          }}>
                            {status.label}
                          </span>
                        </div>
                      </td>

                      {/* Unit */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                        <input
                          type="text"
                          value={p.unit}
                          onChange={(e) => {
                            const val = e.target.value
                            setParams(prev => prev.map(item => item.id === p.id ? { ...item, unit: val } : item))
                          }}
                          placeholder="unit"
                          className="form-input"
                          style={{ width: '80px', padding: '6px 8px', fontSize: '13px' }}
                        />
                      </td>

                      {/* Reference Range */}
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                        {p.min !== undefined && p.max !== undefined && p.min !== null && p.max !== null ? (
                          <span>{p.min} – {p.max}</span>
                        ) : (
                          <span style={{ fontStyle: 'italic' }}>Lab-dependent</span>
                        )}
                      </td>

                      {/* Delete */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(p.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'color 0.15s, background 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--accent-coral)'
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-tertiary)'
                            e.currentTarget.style.background = 'none'
                          }}
                          title="Remove parameter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Notice if values look extreme */}
      {abnormalCount >= 4 && (
        <div style={{
          marginTop: '16px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)'
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span>
            Multiple values fall outside standard clinical reference bounds. The safety engine will review these combinations for physiological correlation and emergency flags.
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div style={{
        marginTop: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <button
          type="button"
          onClick={onBack}
          className="btn btn-secondary"
          style={{ gap: '8px' }}
          disabled={isLoading}
        >
          <ArrowLeft size={16} />
          Back / Re-upload
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary btn-lg"
          style={{
            gap: '10px',
            background: 'linear-gradient(135deg, var(--accent-teal) 0%, #0d9488 100%)',
            boxShadow: '0 8px 24px rgba(20, 184, 166, 0.35)',
            minWidth: '260px'
          }}
          disabled={isLoading || params.filter(p => p.canonicalName && p.value).length === 0}
        >
          <Sparkles size={18} />
          {isLoading ? 'Processing Analysis...' : 'Confirm & Run AI Analysis'}
        </button>
      </div>
    </div>
  )
}
