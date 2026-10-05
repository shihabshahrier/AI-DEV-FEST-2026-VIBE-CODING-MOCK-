import { useI18n } from '../lib/i18n.jsx'
import { Upload, Building2 } from 'lucide-react'

export default function Header({ building, hasGraph, onImport, onLoadSample }) {
  const { lang, setLang, t } = useI18n()
  const showLive = Boolean(building && (hasGraph ?? true))

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            {/* Inline-SVG: Door with exit arrow */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--exit-ink)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 4v16H4V4h9z" />
              <path d="M9 12h11" />
              <path d="M16 8l4 4-4 4" />
            </svg>
          </div>
          <div className="header__title-group">
            <h1 className="header__title">{t('app.title')}</h1>
            <span className="header__tagline">{t('app.tagline')}</span>
          </div>
        </div>

        {building && (
          <div className="header__meta">
            <span className="header__pill" title={building}>
              {building}
            </span>
            {showLive && (
              <span className="header__live-pill">
                <span className="header__live-dot" aria-hidden="true" />
                {t('header.live')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="header__right">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onImport}
        >
          <Upload size={16} />
          <span>{t('header.import')}</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={onLoadSample}
        >
          <Building2 size={16} />
          <span>{t('header.sample')}</span>
        </button>

        <div className="header__lang-toggle" role="group" aria-label={t('header.lang')}>
          <button
            type="button"
            className={`header__lang-btn ${lang === 'en' ? 'active' : ''}`}
            aria-pressed={lang === 'en'}
            lang="en"
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`header__lang-btn ${lang === 'bn' ? 'active' : ''}`}
            aria-pressed={lang === 'bn'}
            lang="bn"
            onClick={() => setLang('bn')}
          >
            বাং
          </button>
        </div>
      </div>
    </header>
  )
}
