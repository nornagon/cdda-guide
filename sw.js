if(!self.define){let e,s={};const n=(n,i)=>(n=new URL(n+".js",i).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(i,t)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(s[o])return;let r={};const c=e=>n(e,o),l={module:{uri:o},exports:r,require:c};s[o]=Promise.all(i.map((e=>l[e]||c(e)))).then((e=>(t(...e),r)))}}define(["./workbox-690ac063"],(function(e){"use strict";self.skipWaiting(),e.precacheAndRoute([{url:"assets/index-13f65fa5.js",revision:null},{url:"assets/index-828643fe.css",revision:null},{url:"assets/workbox-window.prod.es5-dc90f814.js",revision:null},{url:"global.css",revision:"48a242ee920598989a1733b2356cbd31"},{url:"index.html",revision:"83e058f0a2efbbafbd916bb3fecaac0e"},{url:"favicon.png",revision:"a9f33639a8462cb7299f08c5cb1f3628"},{url:"global.css",revision:"48a242ee920598989a1733b2356cbd31"},{url:"icon-192.png",revision:"5160a2c7b69e85b6621e3e01af05ffc9"},{url:"icon-512.png",revision:"3c525e66297027aa1168dcf24730023d"},{url:"manifest.webmanifest",revision:"18f7bcb56346ec810be59e50f1809e37"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/^https:\/\/raw\.githubusercontent\.com\/.*\/latest\/all\.json$/,new e.NetworkFirst,"GET"),e.registerRoute(/^https:\/\/raw\.githubusercontent\.com\/.*\/all\.json$/,new e.CacheFirst,"GET"),e.registerRoute(/^https:\/\/cds.svc.transifex.net\//,new e.StaleWhileRevalidate,"GET")}));
//# sourceMappingURL=sw.js.map
