/* Consent-gated analytics.
 *
 * The site has no backend and sets no cookies of its own. The only thing it
 * ever stores is the visitor's answer to the banner below, and the only
 * third-party call it can make is the pageview beacon — which is loaded
 * *after* consent, never before.
 *
 * To switch analytics on, set ENDPOINT to a GoatCounter count URL
 * (cookieless, no personal data, no cross-site profile):
 *
 *     const ENDPOINT = 'https://YOURCODE.goatcounter.com/count';
 *
 * While ENDPOINT is empty nothing loads and no banner appears — there is
 * nothing to consent to, and a banner that says otherwise would be a lie.
 */
(function () {
  'use strict';

  var ENDPOINT = '';
  var KEY = 'bg420:analytics-consent';
  var PRIVACY = '/privacy.html';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function write(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ }
  }

  function loadBeacon() {
    if (!ENDPOINT || document.getElementById('bg420-beacon')) return;
    var s = document.createElement('script');
    s.id = 'bg420-beacon';
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.setAttribute('data-goatcounter', ENDPOINT);
    document.head.appendChild(s);
  }

  var STYLE = [
    '.bg420-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
    'background:var(--panel);border-top:1px solid var(--faint);',
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    'color:var(--fg);font:14px/1.55 var(--font-body)}',
    '.bg420-consent>div{max-width:1180px;margin:0 auto;padding:16px clamp(20px,5vw,64px);',
    'display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px}',
    '.bg420-consent p{margin:0;flex:1 1 380px;color:var(--muted);font-size:13.5px}',
    '.bg420-consent a{color:var(--accent)}',
    '.bg420-consent .btns{display:flex;gap:10px;flex:0 0 auto}',
    '.bg420-consent button{font:500 12.5px/1 var(--font-mono);',
    'letter-spacing:.02em;padding:10px 16px;border-radius:2px;cursor:pointer;',
    'border:1px solid var(--faint);background:transparent;color:var(--muted);transition:color .18s,border-color .18s}',
    '.bg420-consent button:hover{color:var(--fg);border-color:var(--accent)}',
    '.bg420-consent button.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}',
    '.bg420-consent button.primary:hover{background:color-mix(in oklab,var(--accent),var(--fg) 14%);color:var(--on-accent)}',
    '.bg420-consent :focus-visible{outline:2px solid var(--accent);outline-offset:3px}',
    '@media(max-width:560px){.bg420-consent .btns{width:100%}.bg420-consent button{flex:1}}'
  ].join('');

  function banner() {
    var style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    var el = document.createElement('aside');
    el.className = 'bg420-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Analytics consent');
    el.innerHTML =
      '<div><p>This site stores nothing about you by default. May I count this ' +
      'page view? It is cookieless and anonymous — no profile, no cross-site ' +
      'tracking. <a href="' + PRIVACY + '">Privacy</a>.</p>' +
      '<div class="btns">' +
      '<button type="button" data-choice="denied">Decline</button>' +
      '<button type="button" class="primary" data-choice="granted">Allow</button>' +
      '</div></div>';

    el.addEventListener('click', function (ev) {
      var choice = ev.target.getAttribute('data-choice');
      if (!choice) return;
      write(choice);
      el.remove();
      document.documentElement.classList.remove('has-consent-banner');
      if (choice === 'granted') loadBeacon();
    });

    document.body.appendChild(el);
    document.documentElement.classList.add('has-consent-banner');
  }

  function start() {
    if (!ENDPOINT) return;
    var choice = read();
    if (choice === 'granted') loadBeacon();
    else if (choice !== 'denied') banner();
  }

  /* Let privacy.html render a live "you currently allow/decline" control. */
  window.bg420Consent = {
    configured: function () { return !!ENDPOINT; },
    get: function () { return read(); },
    set: function (v) {
      write(v);
      if (v === 'granted') loadBeacon();
      else location.reload();
    },
    clear: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ }
      location.reload();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
