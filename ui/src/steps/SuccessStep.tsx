import { Button } from '../ui/Button';

type Props = {
  bookingId: string;
  onStartOver: () => void;
};

export function SuccessStep({ bookingId, onStartOver }: Props) {
  return (
    <section aria-labelledby="success-heading" className="space-y-4" data-testid="booking-success">
      <header>
        <p className="text-sm text-slate-500">All done</p>
        <h1 id="success-heading" className="text-2xl font-semibold mt-1">
          Booking confirmed
        </h1>
      </header>
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-green-300 bg-green-50 p-4"
      >
        <p className="text-sm">
          Your booking reference is{' '}
          <strong data-testid="booking-id">{bookingId}</strong>. You'll receive a
          confirmation email shortly.
        </p>
      </div>
      <div className="pt-2">
        <Button type="button" variant="secondary" onClick={onStartOver} data-testid="start-over">
          Book another skip
        </Button>
      </div>
    </section>
  );
}
