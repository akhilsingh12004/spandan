import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  HeartPulse, 
  ScanEye, 
  Shield, 
  Zap, 
  Brain,
  ChevronRight,
  Check,
  Activity,
  Microscope,
  BarChart3,
  FileCheck,
  FileText,
} from 'lucide-react'
import Disclaimer from '../components/Disclaimer'

export default function HomePage() {
  return (
    <>
      {/* ── Hero Section ── */}
      <section className="hero" id="hero-section">
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="pulse-dot" />
            AI-Powered Diagnostics
          </motion.div>

          <motion.h1
            className="text-display hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Multi-Modal Health Diagnostic Assistant
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Upload an ECG image, skin photo, or blood test report for instant AI analysis.
            Get detailed predictions with confidence scores, Grad-CAM
            explainability heatmaps, lab reference benchmarking, and comprehensive reports.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/cardiac" className="btn btn-primary btn-lg" id="cta-cardiac">
              <HeartPulse size={18} />
              Cardiac Analysis
            </Link>
            <Link to="/skin" className="btn btn-secondary btn-lg" id="cta-skin">
              <ScanEye size={18} />
              Skin Analysis
            </Link>
            <Link to="/blood" className="btn btn-secondary btn-lg" id="cta-blood">
              <FileText size={18} />
              Blood Report
            </Link>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="hero-stat">
              <div className="hero-stat-value">31</div>
              <div className="hero-stat-label">Cardiac Conditions</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">29</div>
              <div className="hero-stat-label">Skin Conditions</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">25+</div>
              <div className="hero-stat-label">Blood Lab Tests</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;3s</div>
              <div className="hero-stat-label">Processing Time</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ECG Divider ── */}
      <div className="ecg-divider" />

      {/* ── Module Cards ── */}
      <section className="modules-section" id="modules-section">
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '56px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-h1">Choose Your Diagnostic Module</h2>
            <p className="text-body" style={{ marginTop: '12px', fontSize: 'var(--text-lg)' }}>
              Select the appropriate module based on your health modality
            </p>
          </motion.div>

          <div className="modules-grid">
            {/* Cardiac Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/cardiac" style={{ textDecoration: 'none' }}>
                <div className="module-card module-card-cardiac" id="module-cardiac">
                  <div className="module-icon module-icon-cardiac">
                    <HeartPulse size={24} />
                  </div>
                  <h3>Cardiac Disease Prediction</h3>
                  <p>
                    Upload a photo or scan of an ECG strip. Our AI digitizes the
                    waveform, extracts P-QRS-T features, and classifies cardiac
                    conditions using a trained CNN model.
                  </p>
                  <ul className="module-features">
                    {[
                      'ECG image to digital signal conversion',
                      'Automatic R-peak & wave detection',
                      'Hierarchical classification (Core & Extended)',
                      '31 cardiac condition classification',
                      'Signal-based Grad-CAM visualization',
                    ].map((feat) => (
                      <li key={feat}>
                        <Check size={14} className="cardiac-check" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <span className="btn btn-primary">
                    Start Analysis <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Skin Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link to="/skin" style={{ textDecoration: 'none' }}>
                <div className="module-card module-card-skin" id="module-skin">
                  <div className="module-icon module-icon-skin">
                    <ScanEye size={24} />
                  </div>
                  <h3>Skin Disease Prediction</h3>
                  <p>
                    Upload a photo of a skin lesion or affected area. Our AI
                    preprocesses the image, segments the lesion, and classifies
                    dermatological conditions using transfer learning.
                  </p>
                  <ul className="module-features">
                    {[
                      'Artifact removal & contrast enhancement',
                      'Automated lesion segmentation',
                      'Hierarchical categorization (Core & Extended)',
                      '29 dermatological condition classification',
                      'Image-based Grad-CAM heatmap overlay',
                    ].map((feat) => (
                      <li key={feat}>
                        <Check size={14} className="skin-check" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <span className="btn btn-primary">
                    Start Analysis <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Blood Test Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to="/blood" style={{ textDecoration: 'none' }}>
                <div className="module-card module-card-blood" id="module-blood">
                  <div className="module-icon module-icon-blood">
                    <FileText size={24} />
                  </div>
                  <h3>Blood Test Analysis</h3>
                  <p>
                    Upload a photo or PDF of routine blood tests (CBC, Lipids, LFT, KFT, Thyroid, Vitamins).
                    Our OCR engine extracts parameters, benchmarks reference ranges, and detects disease patterns.
                  </p>
                  <ul className="module-features">
                    {[
                      'PDF & Image report OCR text extraction',
                      '25+ standard adult clinical lab parameters',
                      'Low / Normal / High / Critical range alerts',
                      'Multi-parameter pattern disease correlation',
                      'Holistic health score & doctor consultation alert',
                    ].map((feat) => (
                      <li key={feat}>
                        <Check size={14} className="blood-check" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <span className="btn btn-primary">
                    Start Analysis <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── ECG Divider ── */}
      <div className="ecg-divider" />

      {/* ── How It Works ── */}
      <section style={{ padding: '100px 24px 120px' }} id="how-it-works">
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '64px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-h1">How It Works</h2>
            <p className="text-body" style={{ marginTop: '12px', fontSize: 'var(--text-lg)' }}>
              From image upload to diagnostic report in seconds
            </p>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
            gap: '20px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}>
            {[
              { icon: <FileCheck size={20} />, title: 'Upload Image', desc: 'Upload an ECG strip photo or skin lesion image through our drag-and-drop interface.' },
              { icon: <Zap size={20} />, title: 'AI Processing', desc: 'Our pipeline preprocesses the image, extracts features, and removes noise automatically.' },
              { icon: <Brain size={20} />, title: 'Model Inference', desc: 'Trained deep learning models analyze the data and classify the condition with confidence scores.' },
              { icon: <BarChart3 size={20} />, title: 'Get Results', desc: 'Receive a detailed report with prediction, confidence scores, Grad-CAM heatmap, and metrics.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                className="glass-card"
                style={{ textAlign: 'center', position: 'relative', paddingTop: '36px' }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                {/* Step number — simple, no colored box */}
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--bg-primary)',
                }}>
                  {i + 1}
                </div>
                {/* Icon — no colored box wrapper, just the icon */}
                <div style={{
                  color: 'var(--accent)',
                  marginBottom: '14px',
                  opacity: 0.7,
                }}>
                  {step.icon}
                </div>
                <h3 style={{ 
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-md)', 
                  fontWeight: 600, 
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                }}>
                  {step.title}
                </h3>
                <p className="text-body" style={{ fontSize: 'var(--text-sm)' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ECG Divider ── */}
      <div className="ecg-divider" />

      {/* ── Features ── */}
      <section style={{ padding: '80px 24px 120px' }}>
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '48px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-h1">Key Features</h2>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '16px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}>
            {[
              { icon: <Shield size={18} />, title: 'Grad-CAM Explainability', desc: 'See exactly which regions of the image influenced the AI prediction with heatmap overlays.' },
              { icon: <Activity size={18} />, title: 'Signal Digitization', desc: 'ECG images are digitized into numerical time-series for precise feature extraction and analysis.' },
              { icon: <Microscope size={18} />, title: 'Lesion Segmentation', desc: 'Automatic skin lesion segmentation isolates regions of interest for more accurate classification.' },
              { icon: <BarChart3 size={18} />, title: 'Confidence Scoring', desc: 'Every prediction comes with per-class confidence percentages so you understand the model\'s certainty.' },
              { icon: <Brain size={18} />, title: 'Deep Learning Models', desc: 'Powered by 1D-CNN/LSTM for ECG and EfficientNet/ResNet with transfer learning for skin analysis.' },
              { icon: <Zap size={18} />, title: 'Real-time Processing', desc: 'Get predictions in under 3 seconds with our optimized inference pipeline.' },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                className="glass-card"
                style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <div style={{
                  color: 'var(--accent)',
                  flexShrink: 0,
                  marginTop: '2px',
                  opacity: 0.8,
                }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 style={{ 
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-base)', 
                    fontWeight: 600, 
                    marginBottom: '4px',
                    color: 'var(--text-primary)',
                  }}>
                    {feat.title}
                  </h3>
                  <p className="text-body" style={{ fontSize: 'var(--text-sm)' }}>{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div className="container-narrow">
          <Disclaimer />
        </div>
      </section>
    </>
  )
}
