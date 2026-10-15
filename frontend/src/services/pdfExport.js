import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Generates a comprehensive, professional, multi-page Clinical Laboratory Report PDF
 * @param {Object} results - Blood test analysis results
 * @param {Object} patientContext - Patient clinical profile (age, sex, symptoms, medications)
 */
export function exportBloodReportPDF(results, patientContext = null) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const timestamp = new Date().toLocaleString()
  const reportId = `SPN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`

  const primaryColor = [13, 148, 136] // teal #0d9488
  const darkBg = [15, 23, 42]        // slate-900 #0f172a
  const textDark = [30, 41, 59]       // slate-800
  const textMuted = [100, 116, 139]   // slate-500
  const dangerColor = [225, 29, 72]   // rose-600
  const amberColor = [217, 119, 6]    // amber-600

  // ─────────────────────────────────────────────────────────────
  // PAGE 1: HEADER, PATIENT PROFILE, SAFETY & EXECUTIVE SUMMARY
  // ─────────────────────────────────────────────────────────────

  // Top Accent Bar
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 6, 'F')

  // Header Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...primaryColor)
  doc.text('SPANDAN AI', 14, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...textMuted)
  doc.text('Comprehensive Blood Test Clinical Interpretation Report', 14, 26)

  // Report Metadata (right side)
  doc.setFontSize(8)
  doc.text(`Report ID: ${reportId}`, pageWidth - 14, 18, { align: 'right' })
  doc.text(`Generated: ${timestamp}`, pageWidth - 14, 23, { align: 'right' })
  doc.text('Engine: Spandan Clinical AI v2.4', pageWidth - 14, 28, { align: 'right' })

  // Divider Line
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(14, 32, pageWidth - 14, 32)

  let curY = 38

  // 1. Patient Profile Box
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(14, curY, pageWidth - 28, 26, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...textDark)
  doc.text('PATIENT CLINICAL PROFILE', 20, curY + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...textDark)

  const ageText = patientContext?.age ? `${patientContext.age} yrs` : 'Not specified'
  const sexText = patientContext?.sex || 'Not specified'
  const fastingText = patientContext?.fasting || 'Standard'
  const pregnancyText = patientContext?.pregnancy && patientContext.pregnancy !== 'No' ? ` (Pregnant: ${patientContext.pregnancy})` : ''

  doc.text(`Age: ${ageText}`, 20, curY + 14)
  doc.text(`Biological Sex: ${sexText}${pregnancyText}`, 65, curY + 14)
  doc.text(`Fasting State: ${fastingText}`, 130, curY + 14)

  const symptomsText = patientContext?.symptoms || 'None reported'
  const medsText = patientContext?.medications ? ` | Meds: ${patientContext.medications}` : ''
  const truncatedSymptoms = doc.splitTextToSize(`Symptoms: ${symptomsText}${medsText}`, pageWidth - 44)
  doc.text(truncatedSymptoms[0], 20, curY + 21)

  curY += 32

  // 2. Health Score & Urgency KPI Cards
  const summary = results.summary || {}
  const healthScore = summary.healthScore ?? 75
  const safety = results.safety || {}
  const urgency = safety.overallUrgency || 'ROUTINE'
  const abnormalCount = summary.abnormalCount ?? 0
  const criticalCount = summary.criticalCount ?? 0

  const kpiWidth = (pageWidth - 28 - 9) / 4

  // Card 1: Health Score
  doc.setFillColor(240, 253, 250)
  doc.setDrawColor(153, 246, 228)
  doc.roundedRect(14, curY, kpiWidth, 20, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...primaryColor)
  doc.text('HEALTH SCORE', 14 + kpiWidth / 2, curY + 6, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`${healthScore} / 100`, 14 + kpiWidth / 2, curY + 14, { align: 'center' })

  // Card 2: Urgency
  const isUrgent = urgency === 'URGENT'
  doc.setFillColor(isUrgent ? 255 : 254, isUrgent ? 241 : 243, isUrgent ? 242 : 199)
  doc.setDrawColor(isUrgent ? 254 : 252, isUrgent ? 205 : 211, isUrgent ? 211 : 77)
  doc.roundedRect(14 + kpiWidth + 3, curY, kpiWidth, 20, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(isUrgent ? 225 : 180, isUrgent ? 29 : 83, isUrgent ? 72 : 9)
  doc.text('CLINICAL ACUITY', 14 + kpiWidth + 3 + kpiWidth / 2, curY + 6, { align: 'center' })
  doc.setFontSize(11)
  doc.text(urgency, 14 + kpiWidth + 3 + kpiWidth / 2, curY + 14, { align: 'center' })

  // Card 3: Abnormal Tests
  doc.setFillColor(254, 252, 232)
  doc.setDrawColor(254, 240, 138)
  doc.roundedRect(14 + (kpiWidth + 3) * 2, curY, kpiWidth, 20, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...amberColor)
  doc.text('OUT OF RANGE', 14 + (kpiWidth + 3) * 2 + kpiWidth / 2, curY + 6, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`${abnormalCount}`, 14 + (kpiWidth + 3) * 2 + kpiWidth / 2, curY + 14, { align: 'center' })

  // Card 4: Normal Tests
  doc.setFillColor(241, 245, 249)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14 + (kpiWidth + 3) * 3, curY, kpiWidth, 20, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...textMuted)
  doc.text('NORMAL RANGE', 14 + (kpiWidth + 3) * 3 + kpiWidth / 2, curY + 6, { align: 'center' })
  doc.setFontSize(14)
  doc.text(`${summary.normalCount ?? (results.parameters?.length || 0)}`, 14 + (kpiWidth + 3) * 3 + kpiWidth / 2, curY + 14, { align: 'center' })

  curY += 26

  // 3. Deterministic Safety Alert Banner (if any critical or urgent finding)
  if (safety.criticalAlerts?.length > 0 || safety.combinationAlerts?.length > 0) {
    const alertBg = isUrgent ? [255, 241, 242] : [254, 243, 199]
    const alertBorder = isUrgent ? [254, 205, 211] : [252, 211, 77]
    const alertText = isUrgent ? [159, 18, 57] : [146, 64, 14]

    doc.setFillColor(...alertBg)
    doc.setDrawColor(...alertBorder)
    doc.roundedRect(14, curY, pageWidth - 28, 24, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...alertText)
    doc.text(isUrgent ? 'CRITICAL SAFETY FINDINGS IDENTIFIED' : 'PROMPT MEDICAL REVIEW RECOMMENDED', 20, curY + 7)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    
    const alertLines = []
    if (safety.criticalAlerts?.length > 0) {
      alertLines.push(`Critical values: ${safety.criticalAlerts.map(a => `${a.parameter} (${a.value} ${a.unit})`).join(', ')}`)
    }
    if (safety.combinationAlerts?.length > 0) {
      alertLines.push(`Correlated risk: ${safety.combinationAlerts.map(c => c.name).join('; ')}`)
    }
    alertLines.push(safety.urgencyMessage || 'Please consult your healthcare provider promptly.')

    const renderedAlerts = doc.splitTextToSize(alertLines.join(' | '), pageWidth - 44)
    doc.text(renderedAlerts.slice(0, 2), 20, curY + 13)

    curY += 30
  }

  // 4. Executive Clinical Summary
  const aiExp = results.aiExplanation || {}
  const execSummary = aiExp.executiveSummary || 'Laboratory report analysis completed based on adult reference bounds.'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...textDark)
  doc.text('EXECUTIVE CLINICAL SUMMARY', 14, curY)
  curY += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...textDark)
  const execLines = doc.splitTextToSize(execSummary, pageWidth - 28)
  doc.text(execLines, 14, curY)
  curY += (execLines.length * 4.5) + 6

  // 5. Correlated Pathological Syndromes Table (on Page 1)
  const conditions = results.conditions || []
  if (conditions.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...textDark)
    doc.text(`DETECTED CLINICAL PATTERNS (${conditions.length})`, 14, curY)
    curY += 4

    const conditionRows = conditions.map(c => [
      c.condition,
      c.severity || c.likelihood || 'Moderate',
      Array.isArray(c.evidence) ? c.evidence.join('; ') : (c.primaryIndicators ? c.primaryIndicators.join('; ') : 'Report parameters'),
      c.recommendation || c.rationale || 'Discuss with physician.'
    ])

    autoTable(doc, {
      startY: curY,
      head: [['Condition / Syndrome', 'Severity', 'Clinical Evidence', 'Action / Recommendation']],
      body: conditionRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: textDark,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 20 },
        2: { cellWidth: 60 },
        3: { cellWidth: 60 },
      },
      margin: { left: 14, right: 14 },
    })

    curY = doc.lastAutoTable.finalY + 8
  }

  // ─────────────────────────────────────────────────────────────
  // PAGE 2: COMPLETE BENCHMARKED PARAMETERS TABLE
  // ─────────────────────────────────────────────────────────────
  doc.addPage()

  // Accent Header Bar
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...primaryColor)
  doc.text('LABORATORY TEST PARAMETERS BENCHMARK', 14, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...textMuted)
  doc.text(`Evaluation against standard adult reference intervals | Total tests evaluated: ${results.parameters?.length || 0}`, 14, 21)

  const params = results.parameters || []
  const paramRows = params.map(p => {
    const refRange = (p.refLow !== undefined && p.refHigh !== undefined && p.refLow !== null)
      ? `${p.refLow} – ${p.refHigh}`
      : (p.refText || 'Lab-dependent')

    let statusText = p.status || 'NORMAL'
    if (statusText === 'CRITICAL_LOW') statusText = 'CRITICAL LOW'
    if (statusText === 'CRITICAL_HIGH') statusText = 'CRITICAL HIGH'

    return [
      p.canonicalName || p.name,
      p.panel || 'Routine',
      `${p.value} ${p.unit || ''}`,
      refRange,
      p.unit || '',
      statusText,
    ]
  })

  autoTable(doc, {
    startY: 26,
    head: [['Test Name', 'Panel', 'Measured Value', 'Standard Reference', 'Unit', 'Status']],
    body: paramRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: textDark,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 16 },
      5: { cellWidth: 24, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const val = String(data.cell.raw).toUpperCase()
        if (val.includes('CRITICAL')) {
          data.cell.styles.textColor = dangerColor
        } else if (val === 'HIGH' || val === 'LOW') {
          data.cell.styles.textColor = amberColor
        } else if (val === 'NORMAL') {
          data.cell.styles.textColor = [16, 185, 129] // emerald
        }
      }
    },
    margin: { left: 14, right: 14 },
  })

  // ─────────────────────────────────────────────────────────────
  // PAGE 3: FOLLOW-UP RECOMMENDATIONS, ORGAN BREAKDOWN & GUIDELINES
  // ─────────────────────────────────────────────────────────────
  doc.addPage()

  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 5, 'F')

  let p3Y = 16

  // 1. Follow-up Investigation Recommendations
  const followUps = results.followUpRecommendations || []
  if (followUps.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...primaryColor)
    doc.text('RECOMMENDED FOLLOW-UP INVESTIGATIONS', 14, p3Y)
    p3Y += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...textMuted)
    doc.text('Confirmatory and differential tests to discuss with your ordering physician:', 14, p3Y)
    p3Y += 3

    const followUpRows = followUps.map(f => [
      f.test,
      f.reason,
      f.supportingFinding || '-',
      f.question || '-',
      f.priority || 'Recommended'
    ])

    autoTable(doc, {
      startY: p3Y,
      head: [['Recommended Test', 'Clinical Reason', 'Supporting Finding', 'Diagnostic Question', 'Priority']],
      body: followUpRows,
      theme: 'grid',
      headStyles: {
        fillColor: [13, 148, 136],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: textDark,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 45 },
        2: { cellWidth: 35 },
        3: { cellWidth: 42 },
        4: { cellWidth: 18, fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    })

    p3Y = doc.lastAutoTable.finalY + 10
  }

  // 2. Organ Systems Breakdown
  const organSystems = aiExp.organSystems || []
  if (organSystems.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...textDark)
    doc.text('ORGAN SYSTEM FUNCTIONAL EVALUATION', 14, p3Y)
    p3Y += 5

    organSystems.slice(0, 4).forEach(os => {
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(14, p3Y, pageWidth - 28, 18, 1, 1, 'FD')

      const isNormal = os.status === 'OPTIMAL'
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(isNormal ? 13 : 217, isNormal ? 148 : 119, isNormal ? 136 : 6)
      doc.text(`${os.name} — Status: ${os.status}`, 18, p3Y + 5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...textDark)
      const sumLines = doc.splitTextToSize(os.summary || '', pageWidth - 36)
      doc.text(sumLines.slice(0, 2), 18, p3Y + 10)

      p3Y += 21
    })
  }

  // 3. Evidence-Based Clinical Guidelines Citations
  p3Y += 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...textDark)
  doc.text('EVIDENCE-BASED MEDICAL GUIDELINES CITED', 14, p3Y)
  p3Y += 5

  const guidelines = [
    '• ADA Standards of Medical Care in Diabetes: Fasting glucose 70-99 mg/dL normal, 100-125 prediabetes, >=126 diabetes.',
    '• WHO Haemoglobin Concentrations: Normal adult Hb bounds >=13.0 g/dL (men), >=12.0 g/dL (non-pregnant women).',
    '• KDIGO Clinical Practice Guideline for CKD: Serum Creatinine and eGFR staging for renal filtration capacity.',
    '• AHA/ACC Multisociety Cholesterol Guidelines: Target LDL <100 mg/dL for low-risk, <70 mg/dL for high cardiovascular risk.',
    '• Endocrine Society Thyroid Guidelines: Standard TSH reference range 0.45 – 4.50 mIU/L.'
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...textMuted)
  guidelines.forEach(g => {
    doc.text(g, 14, p3Y)
    p3Y += 4
  })

  // Mandatory Clinical Disclaimer Footer
  const disclaimerY = pageHeight - 20
  doc.setDrawColor(226, 232, 240)
  doc.line(14, disclaimerY - 2, pageWidth - 14, disclaimerY - 2)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.5)
  doc.setTextColor(...textMuted)
  const discText = doc.splitTextToSize(
    'IMPORTANT MEDICAL DISCLAIMER: This automated report is generated by Spandan AI for educational and decision-support purposes only. It is NOT a definitive medical diagnosis. Laboratory test values must always be correlated with clinical symptoms and physical examination by a licensed medical practitioner. In case of acute or emergency symptoms, contact emergency medical services immediately.',
    pageWidth - 28
  )
  doc.text(discText, 14, disclaimerY + 2)

  // Save the PDF
  const filename = `Spandan_Blood_Report_${Date.now()}.pdf`
  doc.save(filename)
  return filename
}
