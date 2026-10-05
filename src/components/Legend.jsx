import { useState } from 'react'
import { useI18n } from '../lib/i18n.jsx'
import { ChevronDown } from 'lucide-react'

export default function Legend() {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 960
    }
    return true
  })

  return (
    <div className="legend">
      <button
        type="button"
        className="legend__header"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>{t('legend.title')}</span>
        <ChevronDown size={14} className={`legend__chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="legend__grid">
          {/* Room */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="14" height="14" rx="3" fill="var(--surface-3)" stroke="#94A3B8" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.room')}</span>
          </div>

          {/* Junction */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="5" fill="var(--surface-3)" stroke="#94A3B8" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.junction')}</span>
          </div>

          {/* Exit */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2.5" fill="var(--exit)" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.exit')}</span>
          </div>

          {/* Start */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" fill="none" stroke="var(--route)" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="4.5" fill="var(--route)" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.start')}</span>
          </div>

          {/* Route */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="2" y1="10" x2="18" y2="10" stroke="var(--route)" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.route')}</span>
          </div>

          {/* Blocked */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" fill="var(--hazard)" />
                <line x1="7" y1="7" x2="13" y2="13" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="13" y1="7" x2="7" y2="13" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.blocked')}</span>
          </div>

          {/* Closed exit */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="12" rx="2.5" fill="#475569" stroke="var(--warn)" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.closed')}</span>
          </div>

          {/* Unusable corridor */}
          <div className="legend__item">
            <span className="legend__swatch" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <line x1="2" y1="10" x2="18" y2="10" stroke="var(--faint)" strokeWidth="2" strokeDasharray="3 3" />
              </svg>
            </span>
            <span className="legend__label">{t('legend.unusable')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
