/*
  RateFeed — fetches and parses live data from two public, keyless JSON APIs:
    - Frankfurter  (https://api.frankfurter.dev)   — fiat exchange rates, CORS-open
    - CoinGecko    (https://api.coingecko.com)      — crypto market data, CORS-open

  No API keys, no backend, no build step.
*/

const FIAT_ENDPOINT = 'https://api.frankfurter.dev/v1/latest';
const FIAT_SYMBOLS = ['EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY'];
const FIAT_NAMES = {
  USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
  CHF: 'Swiss Franc', CAD: 'Canadian Dollar', AUD: 'Australian Dollar', CNY: 'Chinese Yuan'
};

const CRYPTO_ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price';
const CRYPTO_IDS = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'cardano', 'dogecoin'];
const CRYPTO_META = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC' },
  ethereum: { name: 'Ethereum', symbol: 'ETH' },
  tether: { name: 'Tether', symbol: 'USDT' },
  binancecoin: { name: 'BNB', symbol: 'BNB' },
  solana: { name: 'Solana', symbol: 'SOL' },
  ripple: { name: 'XRP', symbol: 'XRP' },
  cardano: { name: 'Cardano', symbol: 'ADA' },
  dogecoin: { name: 'Dogecoin', symbol: 'DOGE' }
};

document.addEventListener('DOMContentLoaded', () => {

  const $ = (sel) => document.querySelector(sel);

  const statusDot = $('#status-dot');
  const statusText = $('#status-text');
  const consoleBody = $('#console-body');
  const lastUpdatedEl = $('#last-updated');
  const refreshBtn = $('#refresh-btn');
  const baseSelect = $('#base-currency');
  const vsSelect = $('#crypto-vs');

  /* ----------------------------------------
     Console log (the "parsing" visual)
  ---------------------------------------- */
  function log(message, kind = 'meta', crypto = false) {
    const line = document.createElement('span');
    line.className = `console__line console__line--${kind}${crypto ? ' is-crypto' : ''}`;
    line.textContent = message;
    if (consoleBody.querySelector('.console__hint')) consoleBody.innerHTML = '';
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function setStatus(state, label) {
    statusDot.className = 'status-dot' + (state === 'live' ? ' is-live' : state === 'error' ? ' is-error' : '');
    statusText.textContent = label;
  }

  /* ----------------------------------------
     Fetch + parse: fiat exchange rates
  ---------------------------------------- */
  async function loadFiat(base) {
    const url = `${FIAT_ENDPOINT}?base=${base}&symbols=${FIAT_SYMBOLS.filter(c => c !== base).join(',')}`;
    log(`→ GET ${url.replace('https://', '')}`, 'req');

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`);

    const data = await res.json();
    log(`✓ parsed ${Object.keys(data.rates).length} currencies (base ${data.base}, date ${data.date})`, 'ok');

    // Reshape the raw { rates: { EUR: 0.86, ... } } object into row records.
    const rows = Object.entries(data.rates).map(([code, rate]) => ({
      code,
      name: FIAT_NAMES[code] || code,
      rate
    }));
    rows.sort((a, b) => a.code.localeCompare(b.code));
    return rows;
  }

  function renderFiat(rows, base) {
    const tbody = $('#fiat-tbody');
    tbody.innerHTML = '';
    rows.forEach(({ code, name, rate }) => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.className = 'currency-name';
      tdName.textContent = name;

      const tdCode = document.createElement('td');
      tdCode.className = 'currency-code';
      tdCode.textContent = code;

      const tdRate = document.createElement('td');
      tdRate.className = 'num';
      tdRate.textContent = `1 ${base} = ${rate.toFixed(4)}`;

      tr.append(tdName, tdCode, tdRate);
      tbody.appendChild(tr);
    });
  }

  /* ----------------------------------------
     Fetch + parse: crypto markets
  ---------------------------------------- */
  async function loadCrypto(vs) {
    const url = `${CRYPTO_ENDPOINT}?ids=${CRYPTO_IDS.join(',')}&vs_currencies=${vs}&include_24hr_change=true`;
    log(`→ GET ${url.replace('https://', '')}`, 'req', true);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);

    const data = await res.json();
    log(`✓ parsed ${Object.keys(data).length} assets vs ${vs.toUpperCase()}`, 'ok');

    // Reshape { bitcoin: { usd: 67000, usd_24h_change: 1.2 }, ... } into row records.
    const rows = CRYPTO_IDS
      .filter(id => data[id])
      .map(id => ({
        id,
        name: CRYPTO_META[id].name,
        symbol: CRYPTO_META[id].symbol,
        price: data[id][vs],
        change: data[id][`${vs}_24h_change`]
      }));
    return rows;
  }

  function renderCrypto(rows, vs) {
    const tbody = $('#crypto-tbody');
    tbody.innerHTML = '';
    const symbol = vs === 'eur' ? '€' : '$';

    rows.forEach(({ name, symbol: sym, price, change }) => {
      const tr = document.createElement('tr');

      const tdName = document.createElement('td');
      tdName.className = 'currency-name';
      tdName.textContent = name;

      const tdSym = document.createElement('td');
      tdSym.className = 'currency-code';
      tdSym.textContent = sym;

      const tdPrice = document.createElement('td');
      tdPrice.className = 'num';
      tdPrice.textContent = symbol + price.toLocaleString('en-US', { maximumFractionDigits: price < 1 ? 4 : 2 });

      const tdChange = document.createElement('td');
      tdChange.className = 'num ' + (change >= 0 ? 'change-up' : 'change-down');
      const arrow = change >= 0 ? '▲' : '▼';
      tdChange.textContent = `${arrow} ${Math.abs(change ?? 0).toFixed(2)}%`;

      tr.append(tdName, tdSym, tdPrice, tdChange);
      tbody.appendChild(tr);
    });
  }

  function showTableError(tbodyId, colspan, message) {
    const tbody = $(tbodyId);
    tbody.innerHTML = `<tr class="error-row"><td colspan="${colspan}">⚠ ${message}</td></tr>`;
  }

  /* ----------------------------------------
     Orchestration
  ---------------------------------------- */
  async function loadAll() {
    refreshBtn.disabled = true;
    setStatus('loading', 'fetching…');
    log('— starting parallel requests —', 'meta');

    const base = baseSelect.value;
    const vs = vsSelect.value;

    const results = await Promise.allSettled([
      loadFiat(base),
      loadCrypto(vs)
    ]);

    const [fiatResult, cryptoResult] = results;

    if (fiatResult.status === 'fulfilled') {
      renderFiat(fiatResult.value, base);
    } else {
      log(`✗ fiat request failed: ${fiatResult.reason.message}`, 'err');
      showTableError('#fiat-tbody', 3, 'Could not load exchange rates. Try refreshing.');
    }

    if (cryptoResult.status === 'fulfilled') {
      renderCrypto(cryptoResult.value, vs);
    } else {
      log(`✗ crypto request failed: ${cryptoResult.reason.message}`, 'err');
      showTableError('#crypto-tbody', 4, 'Could not load market data. Try refreshing.');
    }

    const anyOk = results.some(r => r.status === 'fulfilled');
    setStatus(anyOk ? 'live' : 'error', anyOk ? 'live' : 'error — see log');
    lastUpdatedEl.textContent = new Date().toLocaleTimeString();
    log('— done —', 'meta');
    refreshBtn.disabled = false;
  }

  refreshBtn.addEventListener('click', loadAll);
  baseSelect.addEventListener('change', loadAll);
  vsSelect.addEventListener('change', loadAll);

  loadAll();
});
