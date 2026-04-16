// Ephemeral in-memory state for MSW handlers.
// Resettable so Playwright can start clean between specs via /_mocks/reset.

type MockState = {
  bs1RetryCounter: number;
  bookingCounter: number;
};

const initial = (): MockState => ({
  bs1RetryCounter: 0,
  bookingCounter: 0,
});

export const mockState: MockState = initial();

export function resetMockState(): void {
  const fresh = initial();
  mockState.bs1RetryCounter = fresh.bs1RetryCounter;
  mockState.bookingCounter = fresh.bookingCounter;
}
