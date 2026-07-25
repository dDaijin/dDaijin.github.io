/*
  Clearway — demo loan calculator & application wizard.
  Everything here runs client-side only.
  There is no fetch(), no XMLHttpRequest, no form action —
  nothing in this file ever leaves the browser.
*/

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------
     Helpers
  ---------------------------------------- */
  const eur = (n) => '€' + Math.round(n).toLocaleString('en-US');
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ----------------------------------------
     Calculator
  ---------------------------------------- */
  const amountEl = $('#amount');
  const termEl = $('#term');
  const rateEl = $('#rate');

  const amountValue = $('#amount-value');
  const termValue = $('#term-value');
  const rateValue = $('#rate-value');

  const monthlyPaymentEl = $('#monthly-payment');
  const principalBar = $('#calc-principal-bar');
  const interestBar = $('#calc-interest-bar');
  const principalVal = $('#calc-principal-val');
  const interestVal = $('#calc-interest-val');

  function calcLoan() {
    const amount = Number(amountEl.value);
    const termMonths = Number(termEl.value);
    const apr = Number(rateEl.value);

    const monthlyRate = apr / 100 / 12;
    const payment = monthlyRate === 0
      ? amount / termMonths
      : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));

    const totalPaid = payment * termMonths;
    const totalInterest = totalPaid - amount;

    return { amount, termMonths, apr, payment, totalPaid, totalInterest };
  }

  function renderCalc() {
    const r = calcLoan();

    amountValue.textContent = eur(r.amount);
    termValue.textContent = `${r.termMonths} months`;
    rateValue.textContent = `${r.apr.toFixed(1)}%`;

    monthlyPaymentEl.textContent = eur(r.payment);

    const principalPct = Math.max(4, Math.min(96, (r.amount / r.totalPaid) * 100));
    const interestPct = 100 - principalPct;

    principalBar.style.width = principalPct + '%';
    interestBar.style.width = interestPct + '%';
    principalVal.textContent = eur(r.amount);
    interestVal.textContent = eur(r.totalInterest);

    // keep wizard step 1 in sync
    const wAmount = $('#w-amount');
    const wTerm = $('#w-term');
    if (wAmount) wAmount.value = eur(r.amount);
    if (wTerm) wTerm.value = `${r.termMonths} months at ${r.apr.toFixed(1)}% APR`;
  }

  [amountEl, termEl, rateEl].forEach(el => el.addEventListener('input', renderCalc));
  renderCalc();

  /* ----------------------------------------
     Wizard navigation
  ---------------------------------------- */
  const stepsNav = $$('#wizard-steps li');
  const stepPanels = $$('.wizard__step');
  let currentStep = 1;

  function goToStep(step) {
    currentStep = step;

    stepPanels.forEach(p => {
      p.classList.toggle('is-active', Number(p.dataset.stepPanel) === step);
    });

    stepsNav.forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-active', n === step);
      li.classList.toggle('is-done', n < step);
    });

    if (step === 1) renderCalc();
    if (step === 4) renderSummary();

    $('#wizard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $$('[data-next]').forEach(btn => {
    btn.addEventListener('click', () => {
      const validateStep = btn.dataset.validate;
      if (validateStep === '2' && !validateApplicant()) return;
      goToStep(currentStep + 1);
    });
  });

  $$('[data-prev]').forEach(btn => {
    btn.addEventListener('click', () => goToStep(currentStep - 1));
  });

  function validateApplicant() {
    const name = $('#f-name').value.trim();
    const email = $('#f-email').value.trim();
    const errorEl = $('#step2-error');
    const ok = name.length > 1 && email.includes('@');
    errorEl.hidden = ok;
    return ok;
  }

  /* ----------------------------------------
     Document preview (local only — never uploaded)
  ---------------------------------------- */
  const fileInput = $('#f-doc');
  const previewImg = $('#dropzone-preview');
  const previewEmpty = $('#dropzone-empty');
  let chosenFileName = null;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    chosenFileName = file.name;

    // Object URL is generated and read entirely in-browser.
    // No network request is made — this is purely a local preview.
    const objectUrl = URL.createObjectURL(file);
    previewImg.src = objectUrl;
    previewImg.hidden = false;
    previewEmpty.hidden = true;
  });

  /* ----------------------------------------
     Summary + simulated submit
  ---------------------------------------- */
  function renderSummary() {
    const r = calcLoan();
    $('#s-amount').textContent = eur(r.amount);
    $('#s-term').textContent = `${r.termMonths} months`;
    $('#s-name').textContent = $('#f-name').value.trim() || '—';
    $('#s-email').textContent = $('#f-email').value.trim() || '—';
    $('#s-phone').textContent = $('#f-phone').value.trim() || '—';
    $('#s-doc').textContent = chosenFileName || 'Not provided';
  }

  $('#submit-btn').addEventListener('click', () => {
    // Intentionally does nothing except reveal the confirmation panel.
    // No fetch/XHR call exists anywhere in this file.
    $('#wizard').hidden = true;
    $('#confirmation').hidden = false;
    $('#confirmation').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#restart-btn').addEventListener('click', () => {
    $('#confirmation').hidden = true;
    $('#wizard').hidden = false;
    $$('.wizard__step form').forEach(f => f.reset && f.reset());
    $('#f-name').value = '';
    $('#f-email').value = '';
    $('#f-phone').value = '';
    $('#f-income').value = '';
    previewImg.hidden = true;
    previewEmpty.hidden = false;
    chosenFileName = null;
    goToStep(1);
  });

  /* ----------------------------------------
     "How does this work?" banner link
  ---------------------------------------- */
  $('#demo-info-link').addEventListener('click', (e) => {
    e.preventDefault();
    $('#how').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ----------------------------------------
     "Continue to application" — pushes calc
     values into step 1 before jumping down
  ---------------------------------------- */
  $('#use-values-btn').addEventListener('click', () => {
    renderCalc();
  });

});
