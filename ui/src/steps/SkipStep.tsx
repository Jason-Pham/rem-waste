import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Skip } from '../api/schemas';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

type Props = {
  postcode: string;
  heavyWaste: boolean;
  initialSize?: string;
  onBack: () => void;
  onContinue: (skip: Skip) => void;
};

type Status =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; skips: Skip[] };

/** "4-yard" → "4 Yard Skip" — simple normalization for display. */
export function formatSkipLabel(size: string): string {
  const m = /^(\d+)-yard$/i.exec(size);
  return m ? `${m[1]} Yard Skip` : size;
}

export function SkipStep({ postcode, heavyWaste, initialSize, onBack, onContinue }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [selected, setSelected] = useState<string | null>(initialSize ?? null);
  const inFlight = useRef<AbortController | null>(null);
  // Version key — forces a re-fetch when postcode/heavyWaste change (e.g. after back+edit).
  const version = `${postcode}::${heavyWaste}`;

  async function load() {
    inFlight.current?.abort();
    const ac = new AbortController();
    inFlight.current = ac;
    setStatus({ kind: 'loading' });
    try {
      const res = await api.listSkips(postcode, heavyWaste, ac.signal);
      if (ac.signal.aborted) return;
      setStatus({ kind: 'ready', skips: res.skips });
      // Clear any stale selection that's now disabled.
      if (initialSize) {
        const stillOk = res.skips.find((s) => s.size === initialSize && !s.disabled);
        if (!stillOk) setSelected(null);
      }
    } catch (err) {
      if (ac.signal.aborted) return;
      setStatus({
        kind: 'error',
        message:
          err instanceof ApiError && err.status >= 500
            ? 'We couldn\'t load skip options. Please try again.'
            : 'Something went wrong loading skip options.',
      });
    }
  }

  useEffect(() => {
    void load();
    return () => inFlight.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  function handleContinue() {
    if (status.kind !== 'ready' || !selected) return;
    const skip = status.skips.find((s) => s.size === selected && !s.disabled);
    if (!skip) return;
    onContinue(skip);
  }

  return (
    <section aria-labelledby="step3-heading" className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Step 3 of 4</p>
        <h1 id="step3-heading" className="text-2xl font-semibold mt-1">
          Choose your skip size
        </h1>
        {heavyWaste && (
          <p className="text-sm text-slate-600 mt-2" data-testid="heavy-waste-notice">
            Some larger skips are unavailable for heavy waste.
          </p>
        )}
      </header>

      {status.kind === 'loading' && <Spinner label="Loading skips" />}

      {status.kind === 'error' && (
        <Alert
          variant="error"
          title="Couldn't load skips"
          actions={
            <Button type="button" variant="secondary" onClick={load} data-testid="skips-retry">
              Retry
            </Button>
          }
        >
          {status.message}
        </Alert>
      )}

      {status.kind === 'ready' && (
        <>
          <div role="radiogroup" aria-label="Skip sizes">
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            data-testid="skip-list"
          >
            {status.skips.map((skip) => {
              const isSelected = selected === skip.size;
              const label = formatSkipLabel(skip.size);
              return (
                <li key={skip.size}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-disabled={skip.disabled}
                    disabled={skip.disabled}
                    onClick={() => !skip.disabled && setSelected(skip.size)}
                    data-testid={`skip-${skip.size}`}
                    data-disabled={skip.disabled ? 'true' : 'false'}
                    className={`w-full text-left rounded-md border p-4 min-h-[96px] transition-colors
                      ${
                        skip.disabled
                          ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
                          : isSelected
                            ? 'border-brand-600 bg-brand-50'
                            : 'border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-base">{label}</span>
                      <span className="text-sm font-semibold" data-testid={`skip-${skip.size}-price`}>
                        £{skip.price}
                      </span>
                    </span>
                    {skip.disabled && skip.reason && (
                      <span
                        className="block text-xs text-slate-600 mt-2"
                        data-testid={`skip-${skip.size}-reason`}
                      >
                        {skip.reason}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          </div>

          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onBack} data-testid="skip-back">
              Back
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!selected}
              data-testid="skip-continue"
            >
              Continue
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
