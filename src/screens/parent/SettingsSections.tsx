import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { t, type UiKey } from '../../i18n.ts';
import { getDailyTime } from '../../storage/db.ts';
import { NumPad } from '../../ui/NumPad.tsx';
import { isValidPin } from './gate.ts';
import { useUpdateSettings } from './useSettings.ts';

const MINUTE_CHOICES = [5, 10, 15, 20, 25, 30, 45, 60];
const PIN_LENGTH = 4;

export function TimeSection() {
  const { db, child, settings } = useApp();
  const update = useUpdateSettings();
  const [today, setToday] = useState(0);
  useEffect(() => {
    void getDailyTime(db, child.id).then(setToday);
  }, [db, child.id]);

  return (
    <section className="parent-card">
      <h2>{t('parent.section.time')}</h2>
      <select value={settings.dailyLimitMinutes} onChange={(e) => void update({ dailyLimitMinutes: Number(e.target.value) })}>
        {MINUTE_CHOICES.map((m) => (
          <option key={m} value={m}>
            {t('parent.time.minutes', { n: m })}
          </option>
        ))}
      </select>
      <p className="help">{t('parent.time.today', { n: Math.round(today / 60_000) })}</p>
    </section>
  );
}

export function OtherSection() {
  const { settings } = useApp();
  const update = useUpdateSettings();
  const [editing, setEditing] = useState(false);
  const [pin, setPin] = useState('');
  const [pinMessage, setPinMessage] = useState<UiKey | null>(null);

  const savePin = () => {
    if (!isValidPin(pin)) return setPinMessage('parent.pin.invalid');
    void update({ parentPin: pin }).then(() => {
      setPinMessage('parent.pin.saved');
      setEditing(false);
      setPin('');
    });
  };

  return (
    <section className="parent-card">
      <h2>{t('parent.section.other')}</h2>
      <label className="toggle-row">
        <input type="checkbox" checked={settings.leftHanded} onChange={(e) => void update({ leftHanded: e.target.checked })} />
        <span className="grow-text">{t('parent.leftHanded')}</span>
      </label>
      <div className="field">
        <span>{t('parent.pin')}</span>
        <span className="field-row">
          <span className="grow-text">{settings.parentPin ? t('parent.pin.isSet') : t('parent.pin.notSet')}</span>
          <button
            type="button"
            className="parent-button"
            onClick={() => {
              setEditing((e) => !e);
              setPin('');
              setPinMessage(null);
            }}
          >
            {t('parent.pin.change')}
          </button>
          {settings.parentPin && (
            <button type="button" className="parent-button subtle" onClick={() => void update({ parentPin: null }).then(() => setPinMessage('parent.pin.saved'))}>
              {t('parent.pin.remove')}
            </button>
          )}
        </span>
        {editing && (
          <div className="pin-editor">
            <output className="gate-value">{'•'.repeat(pin.length)}</output>
            <NumPad
              onDigit={(d) => {
                setPin((p) => (p.length < PIN_LENGTH ? p + d : p));
                setPinMessage(null);
              }}
              onDelete={() => setPin((p) => p.slice(0, -1))}
              onOk={savePin}
            />
          </div>
        )}
      </div>
      {pinMessage && <p className="help">{t(pinMessage)}</p>}
    </section>
  );
}
