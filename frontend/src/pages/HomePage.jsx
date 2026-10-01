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
  Sparkles
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
            Multi-Modal Health{' '}
            <span className="text-gradient">Diagnostic</span>{' '}
            Assistant
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
            <Link to="/cardiac" className="btn btn-cardiac btn-lg" id="cta-cardiac">
              <HeartPulse size={20} />
              Cardiac Analysis
            </Link>
            <Link to="/skin" className="btn btn-skin btn-lg" id="cta-skin">
              <ScanEye size={20} />
              Skin Analysis
            </Link>
            <Link to="/blood" className="btn btn-blood btn-lg" id="cta-blood">
              <FileText size={20} />
              Blood Report Analysis
            </Link>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="hero-stat">
              <div className="hero-stat-value text-gradient">31</div>
              <div className="hero-stat-label">Cardiac Conditions</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value text-gradient">29</div>
              <div className="hero-stat-label">Skin Conditions</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value text-gradient">25+</div>
              <div className="hero-stat-label">Blood Lab Tests</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value text-gradient">&lt;3s</div>
              <div className="hero-stat-label">Processing Time</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Module Cards ── */}
      <section className="modules-section" id="modules-section">
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '48px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-h1">Choose Your Diagnostic Module</h2>
            <p className="text-body" style={{ marginTop: '12px', fontSize: '1.125rem' }}>
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
                    <HeartPulse size={28} />
                  </div>
                  <h3>
                    <span className="text-gradient-cardiac">Cardiac Disease</span> Prediction
                  </h3>
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
                        <Check size={16} className="cardiac-check" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <span className="btn btn-cardiac">
                    Start Cardiac Analysis <ChevronRight size={16} />
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
                    <ScanEye size={28} />
                  </div>
                  <h3>
                    <span className="text-gradient-skin">Skin Disease</span> Prediction
                  </h3>
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
                        <Check size={16} className="skin-check" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <span className="btn btn-skin">
                    Start Skin Analysis <ChevronRight size={16} />
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
                    <FileText size={28} />
                  </div>
                  <h3>
                    <span className="text-gradient-blood">Blood Test</span> Analysis
                  </h3>
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
                        <Check size={16} className="blood-check" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <span className="btn btn-blood">
                    Start Blood Analysis <ChevronRight size={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '80px 24px 120px' }} id="how-it-works">
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '64px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-h1">How It Works</h2>
            <p className="text-body" style={{ marginTop: '12px', fontSize: '1.125rem' }}>
              From image upload to diagnostic report in seconds
            </p>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '24px',
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {[
              { icon: <FileCheck size={24} />, title: 'Upload Image', desc: 'Upload an ECG strip photo or skin lesion image through our drag-and-drop interface.' },
              { icon: <Zap size={24} />, title: 'AI Processing', desc: 'Our pipeline preprocesses the image, extracts features, and removes noise automatically.' },
              { icon: <Brain size={24} />, title: 'Model Inference', desc: 'Trained deep learning models analyze the data and classify the condition with confidence scores.' },
              { icon: <BarChart3 size={24} />, title: 'Get Results', desc: 'Receive a detailed report with prediction, confidence scores, Grad-CAM heatmap, and metrics.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                className="glass-card"
                style={{ textAlign: 'center', position: 'relative' }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#0a0e1a',
                }}>
                  {i + 1}
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  margin: '12px auto 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(6, 214, 160, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                }}>
                  {step.icon}
                </div>
                <h3 className="text-h3" style={{ marginBottom: '8px' }}>{step.title}</h3>
                <p className="text-body" style={{ fontSize: '0.9375rem' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '0 24px 120px' }}>
        <div className="container">
          <motion.div
            style={{ textAlign: 'center', marginBottom: '48px' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-h1">
              <Sparkles size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '12px', color: 'var(--accent-amber)' }} />
              Key Features
            </h2>
          </motion.div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px',
            maxWidth: '1100px',
            margin: '0 auto',
          }}>
            {[
              { icon: <Shield size={22} />, title: 'Grad-CAM Explainability', desc: 'See exactly which regions of the image influenced the AI prediction with heatmap overlays.', color: 'var(--accent-cyan)' },
              { icon: <Activity size={22} />, title: 'Signal Digitization', desc: 'ECG images are digitized into numerical time-series for precise feature extraction and analysis.', color: 'var(--accent-rose)' },
              { icon: <Microscope size={22} />, title: 'Lesion Segmentation', desc: 'Automatic skin lesion segmentation isolates regions of interest for more accurate classification.', color: 'var(--accent-purple)' },
              { icon: <BarChart3 size={22} />, title: 'Confidence Scoring', desc: 'Every prediction comes with per-class confidence percentages so you understand the model\'s certainty.', color: 'var(--accent-blue)' },
              { icon: <Brain size={22} />, title: 'Deep Learning Models', desc: 'Powered by 1D-CNN/LSTM for ECG and EfficientNet/ResNet with transfer learning for skin analysis.', color: 'var(--accent-amber)' },
              { icon: <Zap size={22} />, title: 'Real-time Processing', desc: 'Get predictions in under 3 seconds with our optimized inference pipeline.', color: 'var(--accent-cyan)' },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                className="glass-card"
                style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-md)',
                  background: `${feat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: feat.color,
                  flexShrink: 0,
                }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>{feat.title}</h3>
                  <p className="text-body" style={{ fontSize: '0.875rem' }}>{feat.desc}</p>
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
