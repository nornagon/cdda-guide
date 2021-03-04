import App from './App.svelte';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js').then(function(registration) {
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

const app = new App({
  target: document.body,
});

export default app;
