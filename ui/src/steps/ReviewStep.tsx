import { useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Address, BookingConfirmRequest, Skip } from '../api/schemas';
import { formatSkipLabel } from './SkipStep';
import type { WasteSelection } from './WasteTypeStep';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

type Props = {
  postcode: string;
  address: Address;
  waste: WasteSelection;
  skip: Skip;
  onBack: () => void;
  onConfirmed: (bookingId: string) => void;
};

const HANDLING_LABELS: Record<NonNullable<WasteSelection['plasterboardOption']>, string> = {
  under_10:  'Under 10% of load',
  '10_to_25': '10–25% of load',
  over_25:   'Over 25% of load',
};

// A deterministic permit fee for visible price breakdown — keeps arithmetic verifiable.
const PERMIT_FEE = 30;
const VAT_RATE = 0.2;

export function buildPriceBreakdown(skipPrice: number) {
  const subtotal = skipPrice + PERMIT_FEE;
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;
  return {
    skipPrice,
    permitFee: PERMIT_FEE,
    subtotal,
    vat,
    total,
  };
}

export function ReviewStep({ postcode, address, waste, skip, onBack, onConfirmed }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Idempotency key — stable for this mounted review page; the backend (in a real
  // system) uses it to deduplicate retries. Prevents double-charges even if the
  // button guard somehow fails.
  const idempotencyKey = useRef(crypto.randomUUID()).current;

  const breakdown = buildPriceBreakdown(skip.price);

  async function handleConfirm() {
    if (submitting) return; // guard 1: button-level short-circuit
    setSubmitting(true);    // guard 2: sync state flip so the disabled prop takes effect immediately
    setError(null);
    try {
      const payload: BookingConfirmRequest = {
        postcode,
        addressId: address.id,
        heavyWaste: waste.heavyWaste,
        plasterboard: waste.plasterboard,
        skipSize: skip.size,
        price: skip.price,
      };
      const res = await api.confirmBooking(payload, { idempotencyKey });
      onConfirmed(res.bookingId);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status >= 500
          ? 'Booking failed. Please try again.'
          : 'We couldn\'t confirm your booking. Please try again.',
      );
      setSubmitting(false);
    }
  }

  const wasteLines: string[] = [];
  if (!waste.heavyWaste && !waste.plasterboard) wasteLines.push('General waste');
  if (waste.heavyWaste) wasteLines.push('Heavy waste');
  if (waste.plasterboard) {
    const opt = waste.plasterboardOption ? ` (${HANDLING_LABELS[waste.plasterboardOption]})` : '';
    wasteLines.push(`Plasterboard${opt}`);
  }

  return (
    <section aria-labelledby="step4-heading" className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Step 4 of 4</p>
        <h1 id="step4-heading" className="text-2xl font-semibold mt-1">
          Review and confirm
        </h1>
      </header>

      <dl className="rounded-md border border-slate-300 divide-y divide-slate-200" data-testid="review-summary">
        <div className="grid grid-cols-3 gap-2 p-3">
          <dt className="text-sm text-slate-500">Delivery to</dt>
          <dd className="col-span-2 text-sm" data-testid="review-address">
            {address.line1}, {address.city} ({postcode})
          </dd>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          <dt className="text-sm text-slate-500">Waste type</dt>
          <dd className="col-span-2 text-sm" data-testid="review-waste">
            {wasteLines.join(' · ')}
          </dd>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          <dt className="text-sm text-slate-500">Skip</dt>
          <dd className="col-span-2 text-sm" data-testid="review-skip">
            {formatSkipLabel(skip.size)}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="price-breakdown-heading" className="rounded-md border border-slate-300 p-4">
        <h2 id="price-breakdown-heading" className="font-medium mb-3">
          Price breakdown
        </h2>
        <dl className="space-y-1 text-sm" data-testid="price-breakdown">
          <div className="flex justify-between">
            <dt>Skip hire ({formatSkipLabel(skip.size)})</dt>
            <dd data-testid="price-skip">£{breakdown.skipPrice.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Permit fee</dt>
            <dd data-testid="price-permit">£{breakdown.permitFee.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>Subtotal</dt>
            <dd data-testid="price-subtotal">£{breakdown.subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>VAT (20%)</dt>
            <dd data-testid="price-vat">£{breakdown.vat.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 mt-2 font-semibold">
            <dt>Total</dt>
            <dd data-testid="price-total">£{breakdown.total.toFixed(2)}</dd>
          </div>
        </dl>
      </section>

      {submitting && <Spinner label="Confirming booking" />}

      {error && (
        <Alert
          variant="error"
          title="Booking failed"
          actions={
            <Button type="button" variant="secondary" onClick={handleConfirm} data-testid="confirm-retry">
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={submitting}
          data-testid="review-back"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          data-testid="confirm-booking"
          aria-disabled={submitting}
        >
          {submitting ? 'Confirming…' : 'Confirm booking'}
        </Button>
      </div>
    </section>
  );
}
