import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

async function enableMocks() {
  // MSW is enabled in dev always, and in preview/prod when the flag is set.
  // For the take-home, the demo deploy relies on MSW in production too.
  const { worker } = await import('./mocks/browser');
  // BASE_URL is '/' in dev and '/rem-waste/' in the Pages build — keeps SW
  // registration inside whatever sub-path Vite was built for.
  const swUrl = `${import.meta.env.BASE_URL}mockServiceWorker.js`;
  await worker.start({
    serviceWorker: { url: swUrl },
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
