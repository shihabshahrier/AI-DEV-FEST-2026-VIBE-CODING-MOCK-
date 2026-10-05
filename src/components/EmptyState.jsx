import { useRef } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { Upload, Building2 } from 'lucide-react'

export default function EmptyState({ onFile, onLoadSample, dragging }) {
  const { t } = useI18n()
  const fileInputRef = useRef(null)

  const handleZoneClick = () => {
    fileInputRef.current?.click()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.[0]) {
      onFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      onFile(e.target.files[0])
    }
  }

  return (
    <div className="empty-state">
      {/* Decorative background SVG mini blueprint */}
      <svg
        className="empty-state__bg-blueprint"
        viewBox="0 0 800 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Background grid corridors */}
        <path
          d="M 120 100 L 260 140 L 460 90 L 680 150 M 120 100 L 160 300 L 360 340 L 460 90 M 360 340 L 580 310 L 680 150"
          stroke="var(--line)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Animated evacuation route */}
        <path
          className="empty-state__route-anim"
          d="M 160 300 L 360 340 L 580 310 L 680 150"
          stroke="var(--route)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Blueprint nodes */}
        <circle cx="120" cy="100" r="5" fill="var(--surface-3)" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="260" cy="140" r="5" fill="var(--surface-3)" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="460" cy="90" r="5" fill="var(--surface-3)" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="680" cy="150" r="7" fill="var(--exit)" />
        <circle cx="160" cy="300" r="6" fill="var(--route)" />
        <circle cx="360" cy="340" r="5" fill="var(--surface-3)" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="580" cy="310" r="5" fill="var(--surface-3)" stroke="#94A3B8" strokeWidth="1.5" />
      </svg>

      <div className="empty-state__hero">
        {/* Left Column: Info & Steps */}
        <div className="empty-state__left">
          <span className="empty-state__kicker">{t('empty.kicker')}</span>
          <h2 className="empty-state__title">
            <span className="empty-state__title-gradient">{t('empty.title')}</span>
          </h2>
          <p className="empty-state__subtitle">{t('empty.subtitle')}</p>

          <div className="empty-state__steps">
            <div className="empty-state__step">
              <span className="empty-state__step-num">01</span>
              <p className="empty-state__step-text">{t('empty.step1')}</p>
            </div>
            <div className="empty-state__step">
              <span className="empty-state__step-num">02</span>
              <p className="empty-state__step-text">{t('empty.step2')}</p>
            </div>
            <div className="empty-state__step">
              <span className="empty-state__step-num">03</span>
              <p className="empty-state__step-text">{t('empty.step3')}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Dropzone & Sample Trigger */}
        <div className="empty-state__right">
          <div
            className={`empty-state__dropzone ${dragging ? 'dragging' : ''}`}
            role="button"
            tabIndex={0}
            onClick={handleZoneClick}
            onKeyDown={handleKeyDown}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            aria-label={t('empty.drop')}
          >
            <div className="empty-state__dropzone-icon" aria-hidden="true">
              <Upload size={24} />
            </div>
            <p className="empty-state__dropzone-text">{t('empty.drop')}</p>
            <p className="empty-state__dropzone-format">{t('empty.format')}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              tabIndex={-1}
              onChange={handleFileChange}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary empty-state__sample-btn"
            onClick={onLoadSample}
          >
            <Building2 size={18} />
            <span>{t('empty.trySample')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
