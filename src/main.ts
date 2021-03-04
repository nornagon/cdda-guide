import App from './App.svelte';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch((err) => {
    console.log('ServiceWorker registration failed: ', err);
  });
  navigator.serviceWorker.ready.then(start)
}

function start() {
  const app = new App({
    target: document.body,
  });
}


//export default app;
