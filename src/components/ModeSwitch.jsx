import { useI18n } from '../lib/i18n.jsx'
import { MapPin, TriangleAlert } from 'lucide-react'

export default function ModeSwitch({ mode, onChange }) {
  const { t } = useI18n()

  return (
    <div className="mode-switch">
      <div className="section-title mode-switch__label">{t('mode.label')}</div>

      <div className="mode-switch__segmented" role="group" aria-label={t('mode.label')}>
        {/* Sliding highlight pill behind active button */}
        <div
          className={`mode-switch__pill ${
            mode === 'hazard' ? 'mode-switch__pill--hazard' : 'mode-switch__pill--start'
          }`}
          aria-hidden="true"
        />

        <button
          type="button"
          className={`mode-switch__btn mode-switch__btn--start ${mode === 'start' ? 'active' : ''}`}
          aria-pressed={mode === 'start'}
          onClick={() => onChange('start')}
        >
          <MapPin size={14} />
          <span>{t('mode.start')}</span>
          <kbd className="mode-switch__kbd">S</kbd>
        </button>

        <button
          type="button"
          className={`mode-switch__btn mode-switch__btn--hazard ${mode === 'hazard' ? 'active' : ''}`}
          aria-pressed={mode === 'hazard'}
          onClick={() => onChange('hazard')}
        >
          <TriangleAlert size={14} />
          <span>{t('mode.hazard')}</span>
          <kbd className="mode-switch__kbd">H</kbd>
        </button>
      </div>

      <p className="mode-switch__hint">
        {t(mode === 'start' ? 'mode.hintStart' : 'mode.hintHazard')}
      </p>
    </div>
  )
}
