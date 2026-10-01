import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Brain, 
  Shield, 
  Heart, 
  Database, 
  Code2, 
  Eye,
  HeartPulse,
  ScanEye,
  Layers,
  LineChart,
  Microscope,
  Server,
  ChevronRight,
  BookOpen,
  FileText
} from 'lucide-react'
import Disclaimer from '../components/Disclaimer'

export default function AboutPage() {
  return (
    <div className="about-page" id="about-page">
      <div className="container">
        {/* Header */}
        <motion.div
          style={{ textAlign: 'center', marginBottom: '64px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-display" style={{ marginBottom: '16px' }}>
            About <span className="text-gradient">Spandan AI</span>
          </h1>
          <p className="text-body" style={{ fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto' }}>
            An AI-powered multi-modal health diagnostic assistant combining
            cardiac ECG analysis and dermatological skin disease prediction.
          </p>
        </motion.div>

        {/* Architecture Overview */}
        <motion.div
          className="glass-card-static"
          style={{ maxWidth: '900px', margin: '0 auto 48px', padding: '40px' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-h2" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Layers size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '12px', color: 'var(--accent-cyan)' }} />
            System Architecture
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '2px', 
            background: 'var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: '32px',
          }}>
            {[
              { label: 'Frontend', tech: 'React + Vite', icon: <Code2 size={20} />, color: 'var(--accent-cyan)' },
              { label: 'Backend', tech: 'FastAPI', icon: <Server size={20} />, color: 'var(--accent-purple)' },
              { label: 'ML Models', tech: 'TensorFlow/Keras', icon: <Brain size={20} />, color: 'var(--accent-rose)' },
            ].map((item) => (
              <div key={item.label} style={{ 
                padding: '24px', 
                textAlign: 'center', 
                background: 'var(--bg-secondary)' 
              }}>
                <div style={{ color: item.color, marginBottom: '8px' }}>{item.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item.tech}</div>
              </div>
            ))}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '2px',
            background: 'var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {[
              { label: 'Image Processing', tech: 'OpenCV, PIL' },
              { label: 'Signal Processing', tech: 'NumPy, SciPy' },
              { label: 'Explainability', tech: 'Grad-CAM' },
              { label: 'Deployment', tech: 'Docker' },
            ].map((item) => (
              <div key={item.label} style={{ 
                padding: '16px', 
                textAlign: 'center', 
                background: 'var(--bg-secondary)' 
              }}>
                <div style={{ fontWeight: 500, fontSize: '0.8125rem', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.tech}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Module Details */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '32px', 
          maxWidth: '1240px', 
          margin: '0 auto 48px' 
        }}>
          {/* Cardiac Module */}
          <motion.div
            className="glass-card-static"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
              }}>
                <HeartPulse size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                <span className="text-gradient-cardiac">Cardiac Module</span>
              </h3>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Pipeline
              </h4>
              <ol style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'ECG image preprocessing (grid removal, noise filtering)',
                  'Waveform trace extraction & digitization',
                  'R-peak detection & P-QRS-T segmentation',
                  'Feature computation (HR, HRV, QT, PR intervals)',
                  '1D-CNN / CNN+LSTM classification (31 classes)',
                  'Grad-CAM signal attribution',
                ].map((step, i) => (
                  <li key={i} style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    padding: '6px 0', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    <span style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      background: 'rgba(244, 63, 94, 0.1)',
                      color: 'var(--accent-rose)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Training Data
              </h4>
              <p className="text-small">
                MIT-BIH Arrhythmia Database & PTB-XL dataset from PhysioNet.
                Patient-ID-based splits with class weighting for imbalanced classes.
              </p>
            </div>
          </motion.div>

          {/* Skin Module */}
          <motion.div
            className="glass-card-static"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(6, 214, 160, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}>
                <ScanEye size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                <span className="text-gradient-skin">Skin Module</span>
              </h3>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Pipeline
              </h4>
              <ol style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'Image preprocessing (resize, normalize, artifact removal)',
                  'Hair removal via morphological blackhat filtering',
                  'Contrast enhancement & noise reduction',
                  'Lesion segmentation & ABCD morphological features',
                  'EfficientNet / ResNet feature extraction (29 classes)',
                  'Dense layer classification with 2D Grad-CAM overlay',
                ].map((step, i) => (
                  <li key={i} style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    padding: '6px 0', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    <span style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      background: 'rgba(6, 214, 160, 0.1)',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Training Data
              </h4>
              <p className="text-small">
                HAM10000, ISIC Archive, DermNet NZ, Fitzpatrick17k datasets.
                Transfer learning with data augmentation and class weighting.
              </p>
            </div>
          </motion.div>

          {/* Blood Test Report Module */}
          <motion.div
            className="glass-card-static"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)',
              }}>
                <FileText size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                <span className="text-gradient-blood">Blood Test Module</span>
              </h3>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Pipeline
              </h4>
              <ol style={{ listStyle: 'none', padding: 0 }}>
                {[
                  'PDF & Image report OCR text and table extraction',
                  'Flexible regex parser for test names, values & units',
                  'Standard adult reference database benchmarking',
                  'Multi-parameter pattern disease correlation engine',
                  'Metabolic health score (0-100) & risk classification',
                  'Plain-language report with doctor consultation flags',
                ].map((step, i) => (
                  <li key={i} style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    padding: '6px 0', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    <span style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: 'var(--accent-amber)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Daily-Use Scope
              </h4>
              <p className="text-small">
                CBC, Lipid Profile, Glycemic, Liver (LFT), Kidney (KFT), Thyroid panel, Electrolytes, Vitamins & Inflammatory markers. Designed for routine health checkups.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Key Highlights */}
        <div className="about-grid" style={{ maxWidth: '1100px', margin: '0 auto 48px' }}>
          {[
            { icon: <Database size={24} />, title: 'Multi-Dataset Training', desc: 'Models trained on multiple curated medical datasets for robust generalization across diverse patient populations.', color: 'var(--accent-blue)' },
            { icon: <Eye size={24} />, title: 'Grad-CAM Explainability', desc: 'Visual heatmaps showing exactly which image regions influenced the prediction, enabling clinical interpretability.', color: 'var(--accent-purple)' },
            { icon: <Shield size={24} />, title: 'Rigorous Evaluation', desc: 'Per-class F1-score, confusion matrix, robustness testing with varied lighting, angles, and synthetic noise.', color: 'var(--accent-amber)' },
            { icon: <LineChart size={24} />, title: 'ECG Digitization', desc: 'Converts paper ECG images to numerical time-series with automatic R-peak, P-QRS-T detection.', color: 'var(--accent-rose)' },
            { icon: <Microscope size={24} />, title: 'Lesion Segmentation', desc: 'Automated skin lesion boundary detection isolating regions of interest from surrounding healthy skin.', color: 'var(--accent-cyan)' },
            { icon: <BookOpen size={24} />, title: 'Educational Purpose', desc: 'Designed as a decision-support tool for education and research, not as a replacement for clinical diagnosis.', color: 'var(--text-muted)' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="glass-card about-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="about-card-icon" style={{ 
                background: `${item.color}15`, 
                color: item.color 
              }}>
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          style={{ textAlign: 'center', marginTop: '48px' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-h2" style={{ marginBottom: '24px' }}>
            Ready to try it out?
          </h2>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/cardiac" className="btn btn-cardiac btn-lg" id="about-cta-cardiac">
              <HeartPulse size={20} />
              Cardiac Analysis
              <ChevronRight size={16} />
            </Link>
            <Link to="/skin" className="btn btn-skin btn-lg" id="about-cta-skin">
              <ScanEye size={20} />
              Skin Analysis
              <ChevronRight size={16} />
            </Link>
            <Link to="/blood" className="btn btn-blood btn-lg" id="about-cta-blood">
              <FileText size={20} />
              Blood Report Analysis
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <div className="container-narrow" style={{ marginTop: '64px' }}>
          <Disclaimer />
        </div>
      </div>
    </div>
  )
}
