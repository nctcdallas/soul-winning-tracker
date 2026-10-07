import { useLanguage } from '#/i18n/language'
import {
  answeredCountLabel,
  onlyRecorderEditsLabel,
  openCountLabel,
  positionLabel,
} from '#/i18n/translate'
import { encounterDateOf, statusLabelOf } from '#/journeys/helpers'
import { Badge } from '#/ui/badge'
import { Button } from '#/ui/button'
import { SidePanel } from '#/ui/side-panel'
import { useOpenTab } from './use-open-tab'
import type { TeamRecord } from '#/team/team-records'

interface TeamPanelProps {
  record: TeamRecord
  mine: boolean
  index: number
  total: number
  onClose: () => void
  onPrevious?: () => void
  onNext?: () => void
}

function TeamPanel({ record, mine, index, total, onClose, onPrevious, onNext }: TeamPanelProps) {
  const { language, t } = useLanguage()
  const openTab = useOpenTab()
  const { person, active, answered } = record

  return (
    <SidePanel
      title={person.soulName}
      meta={`${person.location} · ${encounterDateOf(person, language)}`}
      position={positionLabel(index + 1, total, language)}
      labels={{ close: t('Close'), previous: t('Previous'), next: t('Next') }}
      focusKey={person.id}
      onClose={onClose}
      onPrevious={onPrevious}
      onNext={onNext}
    >
      <div className="team-panel">
        <dl className="team-panel-facts">
          <div>
            <dt className="ui-label">{t('Recorded by')}</dt>
            <dd>
              {record.memberName}
              {person.recorderEmail && <span className="team-muted">{person.recorderEmail}</span>}
            </dd>
          </div>
          <div>
            <dt className="ui-label">{t('Response to the gospel')}</dt>
            <dd>{statusLabelOf(person, language)}</dd>
          </div>
          {(person.healing || person.holySpiritBaptism) && (
            <div>
              <dt className="ui-label">{t('Encounters')}</dt>
              <dd className="badge-row">
                {person.healing && <Badge>{t('Healing')}</Badge>}
                {person.holySpiritBaptism && <Badge>{t('Holy Spirit baptism')}</Badge>}
              </dd>
            </div>
          )}
          {person.notes && (
            <div>
              <dt className="ui-label">{t('Notes')}</dt>
              <dd>{person.notes}</dd>
            </div>
          )}
        </dl>
        <div className="team-panel-prayers">
          <div className="prayers-head">
            <h3 className="ui-label">{t('Intercessory prayer')}</h3>
            {active.length > 0 && (
              <span className="meta">{openCountLabel(active.length, language)}</span>
            )}
          </div>
          {active.map((prayer) => (
            <p key={prayer.id} className="team-panel-request">
              {prayer.requestText}
            </p>
          ))}
          {!active.length && <p className="team-muted">{t('No open requests.')}</p>}
          {answered.length > 0 && (
            <details className="ui-disclosure">
              <summary>{answeredCountLabel(answered.length, language)}</summary>
              <div className="ui-disclosure-body">
                {answered.map((prayer) => (
                  <p key={prayer.id} className="team-panel-request team-muted">
                    {prayer.requestText}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
        {mine ? (
          <div>
            <Button tone="outline" size="sm" arrow onClick={() => openTab('/journey')}>
              {t('Edit in My journey')}
            </Button>
          </div>
        ) : (
          <p className="team-muted">{onlyRecorderEditsLabel(record.memberName, language)}</p>
        )}
      </div>
    </SidePanel>
  )
}

export { TeamPanel }
