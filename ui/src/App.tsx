import { useEffect, useRef, useState } from 'react';
import { PostcodeStep } from './steps/PostcodeStep';
import { WasteTypeStep, type WasteSelection } from './steps/WasteTypeStep';
import { SkipStep } from './steps/SkipStep';
import { ReviewStep } from './steps/ReviewStep';
import { SuccessStep } from './steps/SuccessStep';
import type { Address, Skip } from './api/schemas';

type StepId = 'postcode' | 'waste' | 'skip' | 'review' | 'success';

type BookingState = {
  step: StepId;
  postcode: string | null;
  address: Address | null;
  waste: WasteSelection | null;
  skip: Skip | null;
  bookingId: string | null;
};

const INITIAL: BookingState = {
  step: 'postcode',
  postcode: null,
  address: null,
  waste: null,
  skip: null,
  bookingId: null,
};

const STEP_LABELS: Record<Exclude<StepId, 'success'>, string> = {
  postcode: 'Address',
  waste: 'Waste',
  skip: 'Skip',
  review: 'Review',
};

export function App() {
  const [state, setState] = useState<BookingState>(INITIAL);
  const headingRef = useRef<HTMLDivElement>(null);

  // Move focus to the step container on step change for screen-reader + keyboard users.
  useEffect(() => {
    headingRef.current?.focus();
  }, [state.step]);

  function goBack(to: StepId) {
    setState((s) => ({ ...s, step: to }));
  }

  return (
    <main className="max-w-2xl mx-auto p-4 sm:p-8">
      <div tabIndex={-1} ref={headingRef} aria-live="polite" className="outline-none">
        {state.step !== 'success' && (
          <nav aria-label="Progress" className="mb-6">
            <ol className="flex items-center gap-2 text-xs sm:text-sm" data-testid="step-indicator">
              {(Object.keys(STEP_LABELS) as (keyof typeof STEP_LABELS)[]).map((id, idx) => {
                const isCurrent = state.step === id;
                const steps: StepId[] = ['postcode', 'waste', 'skip', 'review'];
                const isDone = steps.indexOf(state.step) > idx;
                return (
                  <li key={id} className="flex items-center gap-2">
                    <span
                      aria-current={isCurrent ? 'step' : undefined}
                      className={`inline-flex items-center justify-center rounded-full w-6 h-6 text-xs font-medium ${
                        isCurrent
                          ? 'bg-brand-600 text-white'
                          : isDone
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className={isCurrent ? 'font-medium' : 'text-slate-500'}>
                      {STEP_LABELS[id]}
                    </span>
                    {idx < 3 && <span aria-hidden="true" className="text-slate-300">›</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {state.step === 'postcode' && (
          <PostcodeStep
            initialPostcode={state.postcode ?? ''}
            initialSelectedId={state.address?.id ?? null}
            onContinue={({ postcode, address }) =>
              setState((s) => ({
                ...s,
                step: 'waste',
                postcode,
                address,
                // Clear downstream state if the address changed.
                skip: s.address?.id === address.id ? s.skip : null,
              }))
            }
          />
        )}

        {state.step === 'waste' && state.postcode && state.address && (
          <WasteTypeStep
            initial={state.waste ?? undefined}
            onBack={() => goBack('postcode')}
            onContinue={(waste) =>
              setState((s) => ({
                ...s,
                step: 'skip',
                waste,
                // Clear skip selection if heavy-waste toggled — stale disabled-state risk.
                skip: s.waste?.heavyWaste === waste.heavyWaste ? s.skip : null,
              }))
            }
          />
        )}

        {state.step === 'skip' && state.postcode && state.waste && (
          <SkipStep
            postcode={state.postcode}
            heavyWaste={state.waste.heavyWaste}
            initialSize={state.skip?.size}
            onBack={() => goBack('waste')}
            onContinue={(skip) => setState((s) => ({ ...s, step: 'review', skip }))}
          />
        )}

        {state.step === 'review' &&
          state.postcode &&
          state.address &&
          state.waste &&
          state.skip && (
            <ReviewStep
              postcode={state.postcode}
              address={state.address}
              waste={state.waste}
              skip={state.skip}
              onBack={() => goBack('skip')}
              onConfirmed={(bookingId) =>
                setState((s) => ({ ...s, step: 'success', bookingId }))
              }
            />
          )}

        {state.step === 'success' && state.bookingId && (
          <SuccessStep bookingId={state.bookingId} onStartOver={() => setState(INITIAL)} />
        )}
      </div>
    </main>
  );
}
