import { useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Camera, FolderOpen, FileText } from 'lucide-react'

export default function ImageUploader({ 
  onImageSelect, 
  variant = 'cardiac', 
  selectedImage,
  onRemove 
}) {
  const isBlood = variant === 'blood'
  const cameraInputRef = useRef(null)

  const processFile = useCallback((file) => {
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
        const rawPreview = reader.result
        // Optimize large preview images to avoid bloating client-side storage
        if (typeof rawPreview === 'string' && rawPreview.startsWith('data:image') && rawPreview.length > 800000) {
          const img = new Image()
          img.onload = () => {
            let { naturalWidth: width, naturalHeight: height } = img
            const maxDim = 1600
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width)
                width = maxDim
              } else {
                width = Math.round((width * maxDim) / height)
                height = maxDim
              }
            }
            try {
              const canvas = document.createElement('canvas')
              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, width, height)
              const optimized = canvas.toDataURL('image/jpeg', 0.88)
              onImageSelect({
                file,
                preview: optimized,
                isPdf: false,
                name: file.name,
                size: file.size,
              })
            } catch (_) {
              onImageSelect({
                file,
                preview: rawPreview,
                isPdf: false,
                name: file.name,
                size: file.size,
              })
            }
          }
          img.onerror = () => {
            onImageSelect({
              file,
              preview: rawPreview,
              isPdf: false,
              name: file.name,
              size: file.size,
            })
          }
          img.src = rawPreview
        } else {
          onImageSelect({
            file,
            preview: rawPreview,
            isPdf: false,
            name: file.name,
            size: file.size,
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }, [onImageSelect])

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0])
    }
  }, [processFile])

  const loadSampleImage = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    const sampleFileName = variant === 'cardiac' 
      ? '/sample_ecg.png' 
      : '/sample_blood_report.png'

    const displayName = variant === 'cardiac' 
      ? 'sample_ecg_rhythm_strip.png' 
      : 'sample_blood_report.png'

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

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  })

  const handleCameraClick = (e) => {
    e.stopPropagation()
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleChooseFile = (e) => {
    e.stopPropagation()
    open()
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const sampleLabel = variant === 'cardiac'
    ? 'Try with a sample ECG'
    : 'Try with a sample blood report'

  if (selectedImage) {
    return (
      <div className="preview-container" id="image-preview">
        {selectedImage.isPdf ? (
          <div className="pdf-preview-box">
            <FileText size={48} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '8px' }}>
              PDF ready to analyse
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              We'll extract text and tables automatically
            </p>
          </div>
        ) : (
          <img 
            src={selectedImage.preview} 
            alt="Your uploaded file" 
            className="preview-image"
          />
        )}
        
        <button 
          className="preview-remove-btn" 
          onClick={onRemove}
          id="remove-image-btn"
          aria-label="Remove file"
        >
          <X size={16} />
        </button>

        <div className="preview-file-info">
          <ImageIcon size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="file-name">{selectedImage.name}</p>
            <p className="file-size">{formatSize(selectedImage.size)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div {...getRootProps()} id="image-upload-zone">
      <input {...getInputProps()} id="image-upload-input" />
      {/* Hidden camera input for mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleCameraCapture}
      />

      <div className="upload-zone">
        <div className="upload-zone-icon">
          <Upload size={24} />
        </div>
        
        <h3 className="upload-zone-title">
          {isBlood ? 'Upload blood test report' : 'Upload ECG image'}
        </h3>
        <p className="upload-zone-subtitle">
          {isBlood
            ? 'Photo, scan, or PDF of your blood test report.'
            : 'Photo or scan of your ECG paper strip.'}
        </p>

        <div className="upload-actions">
          <button
            type="button"
            onClick={handleCameraClick}
            className="btn btn-primary btn-full"
            id="take-photo-btn"
          >
            <Camera size={18} />
            Take a photo
          </button>
          <button
            type="button"
            onClick={handleChooseFile}
            className="btn btn-secondary btn-full"
            id="choose-file-btn"
          >
            <FolderOpen size={18} />
            Choose from gallery or files
          </button>
        </div>

        <button
          type="button"
          onClick={loadSampleImage}
          className="upload-sample-link"
          id="load-sample-btn"
        >
          {sampleLabel}
        </button>
      </div>
    </div>
  )
}
