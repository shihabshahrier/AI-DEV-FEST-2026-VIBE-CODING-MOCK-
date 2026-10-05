import { useI18n } from '../lib/i18n.jsx'
import { OctagonX, X } from 'lucide-react'

export default function ImportErrors({ errors, onDismiss }) {
  const { t } = useI18n()

  if (!errors || errors.length === 0) return null

  const displayedErrors = errors.slice(0, 8)
  const remainingCount = errors.length - 8

  return (
    <div className="import-errors" role="alert">
      <div className="import-errors__header">
        <div className="import-errors__title-wrap">
          <OctagonX size={18} aria-hidden="true" />
          <strong className="import-errors__title">{t('err.title')}</strong>
        </div>

        <button
          type="button"
          className="import-errors__close"
          aria-label={t('err.dismiss')}
          onClick={onDismiss}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <ul className="import-errors__list">
        {displayedErrors.map((err, idx) => (
          <li key={`${err.code}-${idx}`} className="import-errors__item">
            {t('err.' + err.code, err.params)}
          </li>
        ))}
      </ul>

      {remainingCount > 0 && (
        <div className="import-errors__more">
          {t('err.more', { n: remainingCount })}
        </div>
      )}
    </div>
  )
}
