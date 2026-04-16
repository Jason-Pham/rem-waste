import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import { normalizePostcode, postcodeRegex, type Address } from '../api/schemas';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

function ManualEntry({
  postcode,
  onBack,
  onContinue,
}: {
  postcode: string;
  onBack: () => void;
  onContinue: (addr: Address) => void;
}) {
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    if (line1.trim().length < 3) {
      setError('Enter the first line of your address.');
      return;
    }
    if (city.trim().length < 2) {
      setError('Enter a city or town.');
      return;
    }
    onContinue({
      id: `manual_${Date.now()}`,
      line1: line1.trim(),
      city: city.trim(),
    });
  }

  return (
    <section
      aria-labelledby="manual-entry-heading"
      className="space-y-3 rounded-md border border-slate-300 p-4"
      data-testid="manual-entry"
    >
      <h2 id="manual-entry-heading" className="font-medium">
        Enter your address
      </h2>
      <label className="block text-sm font-medium" htmlFor="manual-line1">
        Address line 1
      </label>
      <input
        id="manual-line1"
        type="text"
        value={line1}
        onChange={(e) => setLine1(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-base min-h-[44px]"
        data-testid="manual-line1"
        autoComplete="address-line1"
      />
      <label className="block text-sm font-medium" htmlFor="manual-city">
        City
      </label>
      <input
        id="manual-city"
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-base min-h-[44px]"
        data-testid="manual-city"
        autoComplete="address-level2"
      />
      <p className="text-sm text-slate-600">
        Postcode: <strong>{postcode}</strong>
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-700" data-testid="manual-error">
          {error}
        </p>
      )}
      <div className="flex justify-between gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onBack} data-testid="manual-cancel">
          Back to search
        </Button>
        <Button type="button" onClick={handleContinue} data-testid="manual-continue">
          Continue
        </Button>
      </div>
    </section>
  );
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'results'; postcode: string; addresses: Address[] }
  | { kind: 'manual'; postcode: string };

type Props = {
  initialPostcode?: string;
  initialSelectedId?: string | null;
  onContinue: (selection: { postcode: string; address: Address }) => void;
};

export function PostcodeStep({
  initialPostcode = '',
  initialSelectedId = null,
  onContinue,
}: Props) {
  const [postcode, setPostcode] = useState(initialPostcode);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const inFlight = useRef<AbortController | null>(null);
  const lastAttempted = useRef<string>('');

  // If we were re-entered (user went Back from step 2) and we already have a
  // postcode value, trigger the lookup so the previously selected address
  // reappears — better UX than an empty Step 1.
  useEffect(() => {
    if (initialPostcode && postcodeRegex.test(normalizePostcode(initialPostcode))) {
      void runLookup(initialPostcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runLookup(raw: string) {
    const normalized = normalizePostcode(raw);
    if (!postcodeRegex.test(normalized)) {
      setValidationError('Enter a valid UK postcode');
      return;
    }
    setValidationError(null);
    lastAttempted.current = normalized;

    inFlight.current?.abort();
    const ac = new AbortController();
    inFlight.current = ac;

    setStatus({ kind: 'loading' });
    // Only clear the selection if the postcode actually changed.
    if (normalized !== lastAttempted.current) setSelectedId(null);

    try {
      const res = await api.lookupPostcode(normalized, ac.signal);
      if (ac.signal.aborted) return;
      setStatus({ kind: 'results', postcode: res.postcode, addresses: res.addresses });
    } catch (err) {
      if (ac.signal.aborted) return;
      const message =
        err instanceof ApiError
          ? err.status >= 500
            ? "We couldn't load addresses. Please try again."
            : "That postcode wasn't recognised."
          : 'Network error. Check your connection and try again.';
      setStatus({ kind: 'error', message });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Clear selection when starting a new lookup from a changed postcode.
    setSelectedId(null);
    void runLookup(postcode);
  }

  function handleRetry() {
    void runLookup(lastAttempted.current || postcode);
  }

  function handleContinue() {
    if (status.kind !== 'results' || !selectedId) return;
    const address = status.addresses.find((a) => a.id === selectedId);
    if (!address) return;
    onContinue({ postcode: status.postcode, address });
  }

  return (
    <section aria-labelledby="step1-heading" className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Step 1 of 4</p>
        <h1 id="step1-heading" className="text-2xl font-semibold mt-1">
          Where do you need the skip?
        </h1>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-3" data-testid="postcode-form">
        <label htmlFor="postcode-input" className="block text-sm font-medium">
          Postcode
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="postcode-input"
            name="postcode"
            type="text"
            inputMode="text"
            autoComplete="postal-code"
            autoCapitalize="characters"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            aria-invalid={validationError ? true : undefined}
            aria-describedby={validationError ? 'postcode-error' : undefined}
            placeholder="e.g. SW1A 1AA"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-base min-h-[44px]"
          />
          <Button
            type="submit"
            disabled={status.kind === 'loading' || postcode.trim().length === 0}
            data-testid="postcode-submit"
          >
            Find address
          </Button>
        </div>
        {validationError && (
          <p id="postcode-error" role="alert" className="text-sm text-red-700">
            {validationError}
          </p>
        )}
      </form>

      {status.kind === 'loading' && (
        <div data-testid="postcode-loading">
          <Spinner label="Finding addresses" />
        </div>
      )}

      {status.kind === 'error' && (
        <Alert
          variant="error"
          title="Something went wrong"
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={handleRetry}
              data-testid="postcode-retry"
            >
              Retry
            </Button>
          }
        >
          {status.message}
        </Alert>
      )}

      {status.kind === 'results' && status.addresses.length === 0 && (
        <div data-testid="postcode-empty" className="space-y-3">
          <Alert variant="info" title="No addresses found">
            We couldn&rsquo;t find any addresses for <strong>{status.postcode}</strong>. Please
            check the postcode, or enter your address manually.
          </Alert>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setStatus({ kind: 'manual', postcode: normalizePostcode(postcode) })
            }
            data-testid="postcode-manual-entry"
          >
            Enter address manually
          </Button>
        </div>
      )}

      {status.kind === 'manual' && (
        <ManualEntry
          postcode={status.postcode}
          onBack={() => setStatus({ kind: 'idle' })}
          onContinue={(addr) => onContinue({ postcode: status.postcode, address: addr })}
        />
      )}

      {status.kind === 'results' && status.addresses.length > 0 && (
        <fieldset className="space-y-3" data-testid="address-list">
          <legend className="text-sm font-medium">
            Select an address ({status.addresses.length} found)
          </legend>
          <ul className="space-y-2">
            {status.addresses.map((addr) => (
              <li key={addr.id}>
                <label
                  className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-slate-50 ${
                    selectedId === addr.id ? 'border-brand-600 bg-brand-50' : 'border-slate-300'
                  }`}
                  data-testid={`address-option-${addr.id}`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={selectedId === addr.id}
                    onChange={() => setSelectedId(addr.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium">{addr.line1}</span>
                    <span className="block text-sm text-slate-600">{addr.city}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!selectedId}
              data-testid="postcode-continue"
            >
              Continue
            </Button>
          </div>
        </fieldset>
      )}
    </section>
  );
}
