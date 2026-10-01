import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Sparkles, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ImageUploader({ 
  onImageSelect, 
  variant = 'skin', 
  selectedImage,
  onRemove 
}) {
  const isCardiac = variant === 'cardiac'
  const isBlood = variant === 'blood'

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

      if (isPdfFile) {
        onImageSelect({
          file,
          preview: null,
          isPdf: true,
          name: file.name,
          size: file.size,
        })
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          onImageSelect({
            file,
            preview: reader.result,
            isPdf: false,
            name: file.name,
            size: file.size,
          })
        }
        reader.readAsDataURL(file)
      }
    }
  }, [onImageSelect])

  const loadSampleImage = async (e) => {
    e.stopPropagation()
    const sampleFileName = isCardiac 
      ? '/sample_ecg.png' 
      : isBlood 
      ? '/sample_blood_report.png' 
      : '/sample_skin.png'

    const displayName = isCardiac 
      ? 'sample_ecg_rhythm_strip.png' 
      : isBlood 
      ? 'sample_blood_report.png' 
      : 'sample_skin_lesion.png'

    try {
      const response = await fetch(sampleFileName)
      const blob = await response.blob()
      const file = new File([blob], displayName, { type: 'image/png' })
      const reader = new FileReader()
      reader.onload = () => {
        onImageSelect({
          file,
          preview: reader.result,
          isPdf: false,
          name: displayName,
          size: blob.size,
        })
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Failed to load sample demo image', err)
    }
  }

  const acceptedFormats = isBlood
    ? {
        'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'],
        'application/pdf': ['.pdf'],
      }
    : {
        'image/*': ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'],
      }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 1,
    multiple: false,
  })

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const zoneClass = isCardiac 
    ? 'upload-zone-cardiac' 
    : isBlood 
    ? 'upload-zone-blood' 
    : ''

  const btnClass = isCardiac 
    ? 'btn-cardiac' 
    : isBlood 
    ? 'btn-blood' 
    : 'btn-skin'

  const titleText = isDragActive
    ? 'Drop your file here'
    : isCardiac
    ? 'Upload ECG Image'
    : isBlood
    ? 'Upload Blood Test Report'
    : 'Upload Skin Photo'

  const subtitleText = isCardiac
    ? 'Upload a photo or scan of an ECG strip.'
    : isBlood
    ? 'Upload a photo, scan, or digital PDF of your blood test report (CBC, Lipid, LFT, KFT, etc.).'
    : 'Upload a clear photo of the affected skin area.'

  const formatBadges = isBlood 
    ? ['PDF', 'PNG', 'JPG', 'JPEG', 'TIFF'] 
    : ['PNG', 'JPG', 'JPEG', 'BMP', 'TIFF', 'WebP']

  const sampleButtonLabel = isCardiac
    ? 'Try with Sample ECG Strip'
    : isBlood
    ? 'Try with Sample Blood Report'
    : 'Try with Sample Skin Lesion'

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div
              {...getRootProps()}
              className={`upload-zone ${zoneClass} ${isDragActive ? 'drag-active' : ''}`}
              id="image-upload-zone"
            >
              <input {...getInputProps()} id="image-upload-input" />
              
              <div className="upload-icon">
                <Upload size={32} />
              </div>
              
              <h3 className="upload-title">{titleText}</h3>
              
              <p className="upload-subtitle">
                Drag & drop or click to browse. {subtitleText}
              </p>

              <div className="upload-formats" style={{ marginBottom: '24px' }}>
                {formatBadges.map(fmt => (
                  <span key={fmt} className="format-badge">{fmt}</span>
                ))}
              </div>

              {/* Instant Demo Sample Button */}
              <div>
                <button
                  type="button"
                  onClick={loadSampleImage}
                  className={`btn ${btnClass} btn-sm`}
                  id="load-sample-btn"
                  style={{
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <Sparkles size={14} />
                  {sampleButtonLabel}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div className="preview-container" id="image-preview">
              {selectedImage.isPdf ? (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.05)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  margin: '12px auto',
                  maxWidth: '380px'
                }}>
                  <FileText size={56} style={{ color: 'var(--accent-rose)', margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    PDF Document Ready for OCR
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    Digital lab tables and text will be parsed
                  </p>
                </div>
              ) : (
                <img 
                  src={selectedImage.preview} 
                  alt="Upload preview" 
                  className="preview-image"
                  style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain' }}
                />
              )}
              <div className="preview-overlay">
                <button 
                  className="preview-remove-btn" 
                  onClick={onRemove}
                  id="remove-image-btn"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
              }}>
                <ImageIcon size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {selectedImage.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatSize(selectedImage.size)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
