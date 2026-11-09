import { useState } from 'react';
import { useApp } from '../../app/AppContext.tsx';
import { t } from '../../i18n.ts';
import { IconButton } from '../../ui/IconButton.tsx';
import { HomeIcon } from '../../ui/Icons.tsx';
import { NumPad } from '../../ui/NumPad.tsx';
import { gatePasses, makeGateQuestion } from './gate.ts';

const MAX_DIGITS = 6;

export function ParentGate({ onPass, onCancel }: { onPass(): void; onCancel(): void }) {
  const { settings } = useApp();
  const [question, setQuestion] = useState(() => makeGateQuestion());
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const pin = settings.parentPin;

  const submit = () => {
    if (gatePasses(value, question, pin)) return onPass();
    setWrong(true);
    setValue('');
    setQuestion(makeGateQuestion());
  };

  return (
    <main className="screen screen--center parent-gate">
      <div className="gate-card">
        <p className="gate-question">{pin ? t('parent.gate.pin') : t('parent.gate.question', { a: question.a, b: question.b })}</p>
        <output className="gate-value">{pin ? '•'.repeat(value.length) : value}</output>
        {wrong && <p className="gate-wrong">{t('parent.gate.wrong')}</p>}
        <NumPad
          onDigit={(d) => {
            setValue((v) => (v.length < MAX_DIGITS ? v + d : v));
            setWrong(false);
          }}
          onDelete={() => setValue((v) => v.slice(0, -1))}
          onOk={submit}
        />
      </div>
      <IconButton label={t('nav.home')} onClick={onCancel}>
        <HomeIcon />
      </IconButton>
    </main>
  );
}
