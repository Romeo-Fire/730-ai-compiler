// ============================================================
//  730 AI Compiler — Content Script (Gemini API)
//  Injected into every page. Creates the floating button + panel.
// ============================================================

(function () {
  if (document.getElementById('ai730-root')) return;

  const API_KEY_STORAGE = 'ai730_apikey';

  const FIELD_MAP = {
    cognome:                    ['input[name*="cognome"]','input[id*="cognome"]','input[placeholder*="ognome"]'],
    nome:                       ['input[name*="nome"]:not([name*="cognome"])','input[id*="nome"]:not([id*="cognome"])'],
    codice_fiscale:             ['input[name*="codiceFiscale"]','input[name*="codice_fiscale"]','input[id*="cf"]','input[maxlength="16"]'],
    data_nascita:               ['input[name*="dataNascita"]','input[type="date"]','input[name*="data_nascita"]'],
    reddito_lavoro_dipendente:  ['input[name*="RC1"]','input[id*="RC1"]','input[name*="reddito"]'],
    ritenute_irpef:             ['input[name*="RC10"]','input[id*="RC10"]','input[name*="ritenute"]'],
    addizionale_regionale:      ['input[name*="RC12"]','input[id*="RC12"]'],
    addizionale_comunale:       ['input[name*="RC14"]','input[id*="RC14"]'],
    spese_sanitarie:            ['input[name*="RP1"]','input[id*="RP1"]','input[name*="sanitari"]'],
    interessi_mutuo:            ['input[name*="RP7"]','input[id*="RP7"]','input[name*="mutuo"]'],
    spese_istruzione:           ['input[name*="RP13"]','input[id*="RP13"]','input[name*="istruzione"]'],
    contributi_previdenziali:   ['input[name*="RP21"]','input[id*="RP21"]','input[name*="contributi"]'],
  };

  const FIELD_LABELS = {
    cognome: 'Cognome', nome: 'Nome', codice_fiscale: 'Codice Fiscale',
    data_nascita: 'Data Nascita', reddito_lavoro_dipendente: 'Reddito Lordo (RC1)',
    ritenute_irpef: 'Ritenute IRPEF (RC10)', addizionale_regionale: 'Add. Regionale (RC12)',
    addizionale_comunale: 'Add. Comunale (RC14)', spese_sanitarie: 'Spese Sanitarie (RP1)',
    interessi_mutuo: 'Interessi Mutuo (RP7)', spese_istruzione: 'Istruzione (RP13)',
    contributi_previdenziali: 'Contributi Prev. (RP21)',
  };

  function injectField(key, value) {
    if (!value) return false;
    const selectors = FIELD_MAP[key] || [];
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          el.focus();
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          el.style.backgroundColor = '#d4edda';
          el.style.transition = 'background-color 0.5s';
          setTimeout(() => { el.style.backgroundColor = ''; }, 2000);
          return true;
        }
      } catch(e) {}
    }
    return false;
  }

  function injectAll(data) {
    let injected = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key === 'note_ai') continue;
      if (injectField(key, value)) injected++;
    }
    return injected;
  }

  const root = document.createElement('div');
  root.id = 'ai730-root';
  document.body.appendChild(root);

  root.innerHTML = `
    <div id="ai730-fab" title="730 AI Compiler">
      <span id="ai730-fab-icon">&#127470;&#127481;</span>
      <span id="ai730-fab-label">730 AI</span>
    </div>

    <div id="ai730-panel" class="ai730-hidden">
      <div id="ai730-panel-header">
        <div id="ai730-panel-title">
          <span>&#127470;&#127481;</span>
          <span>730 AI Compiler</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button id="ai730-settings-btn" class="ai730-icon-btn" title="Impostazioni API Key">&#9881;&#65039;</button>
          <button id="ai730-close-btn" class="ai730-icon-btn" title="Chiudi">&#x2715;</button>
        </div>
      </div>

      <div id="ai730-settings-view" class="ai730-view ai730-hidden">
        <div class="ai730-section-title">Google Gemini API Key</div>
        <p class="ai730-hint">Chiave da <strong>aistudio.google.com</strong>. Salvata localmente, mai condivisa.</p>
        <input id="ai730-apikey-input" type="password" placeholder="AIza..." class="ai730-input" />
        <button id="ai730-apikey-save" class="ai730-btn ai730-btn-primary">&#128190; Salva Chiave</button>
        <div id="ai730-apikey-status" class="ai730-hint" style="margin-top:8px;"></div>
      </div>

      <div id="ai730-main-view" class="ai730-view">
        <div id="ai730-dropzone">
          <div id="ai730-drop-icon">&#128196;</div>
          <div id="ai730-drop-text">Trascina documento o clicca</div>
          <div class="ai730-hint">CU &middot; Busta Paga &middot; Ricevute &middot; PDF / JPG / PNG</div>
          <input id="ai730-file-input" type="file" accept="image/*,application/pdf" style="display:none" />
        </div>

        <div id="ai730-status" class="ai730-hidden"></div>
        <div id="ai730-notes" class="ai730-hidden"></div>

        <div id="ai730-results" class="ai730-hidden">
          <div class="ai730-section-title">Campi Estratti</div>
          <div id="ai730-fields-list"></div>
          <div id="ai730-inject-bar">
            <button id="ai730-inject-btn" class="ai730-btn ai730-btn-primary">&#9889; Compila Campi Pagina</button>
            <button id="ai730-reset-btn" class="ai730-btn ai730-btn-ghost">&#128260; Nuovo</button>
          </div>
          <div id="ai730-inject-result" class="ai730-hidden"></div>
        </div>

        <div class="ai730-footer">&#9888;&#65039; Verifica sempre con un CAF prima di inviare</div>
      </div>
    </div>
  `;

  let extractedData = {};
  let panelOpen = false;
  let settingsOpen = false;

  const fab          = document.getElementById('ai730-fab');
  const panel        = document.getElementById('ai730-panel');
  const closeBtn     = document.getElementById('ai730-close-btn');
  const settingsBtn  = document.getElementById('ai730-settings-btn');
  const settingsView = document.getElementById('ai730-settings-view');
  const mainView     = document.getElementById('ai730-main-view');
  const apikeyInput  = document.getElementById('ai730-apikey-input');
  const apikeySave   = document.getElementById('ai730-apikey-save');
  const apikeyStatus = document.getElementById('ai730-apikey-status');
  const dropzone     = document.getElementById('ai730-dropzone');
  const fileInput    = document.getElementById('ai730-file-input');
  const statusEl     = document.getElementById('ai730-status');
  const notesEl      = document.getElementById('ai730-notes');
  const resultsEl    = document.getElementById('ai730-results');
  const fieldsList   = document.getElementById('ai730-fields-list');
  const injectBtn    = document.getElementById('ai730-inject-btn');
  const resetBtn     = document.getElementById('ai730-reset-btn');
  const injectResult = document.getElementById('ai730-inject-result');

  function show(el) { el.classList.remove('ai730-hidden'); }
  function hide(el) { el.classList.add('ai730-hidden'); }

  function setStatus(msg, type = 'info') {
    statusEl.textContent = msg;
    statusEl.className = 'ai730-status ai730-status-' + type;
    show(statusEl);
  }

  function getApiKey() {
    return new Promise(resolve => {
      chrome.storage.local.get([API_KEY_STORAGE], r => resolve(r[API_KEY_STORAGE] || ''));
    });
  }

  function saveApiKey(key) {
    return new Promise(resolve => {
      chrome.storage.local.set({ [API_KEY_STORAGE]: key }, resolve);
    });
  }

  fab.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.classList.toggle('ai730-hidden', !panelOpen);
    fab.classList.toggle('ai730-active', panelOpen);
  });

  closeBtn.addEventListener('click', () => {
    panelOpen = false;
    panel.classList.add('ai730-hidden');
    fab.classList.remove('ai730-active');
  });

  settingsBtn.addEventListener('click', async () => {
    settingsOpen = !settingsOpen;
    settingsView.classList.toggle('ai730-hidden', !settingsOpen);
    mainView.classList.toggle('ai730-hidden', settingsOpen);
    if (settingsOpen) {
      const key = await getApiKey();
      apikeyInput.value = key;
    }
  });

  apikeySave.addEventListener('click', async () => {
    const key = apikeyInput.value.trim();
    if (!key.startsWith('AIza')) {
      apikeyStatus.textContent = 'Chiave non valida. Deve iniziare con AIza';
      return;
    }
    await saveApiKey(key);
    apikeyStatus.textContent = 'Chiave salvata!';
    setTimeout(() => {
      settingsOpen = false;
      hide(settingsView);
      show(mainView);
      apikeyStatus.textContent = '';
    }, 1200);
  });

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('ai730-drag');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('ai730-drag'));

  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('ai730-drag');
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  });

  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });

  async function handleFile(file) {
    const isImage = file.type.startsWith('image/');
    const isPdf   = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      setStatus('Formato non supportato. Usa JPG, PNG o PDF.', 'error');
      return;
    }
    hide(resultsEl);
    hide(notesEl);
    hide(injectResult);
    setStatus('Lettura documento...', 'info');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      await analyzeDocument(base64, file.type);
    };
    reader.readAsDataURL(file);
  }

  // ── Gemini API call ──────────────────────────────────────
  async function analyzeDocument(base64, mediaType) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      setStatus('Prima imposta la tua API Key nelle impostazioni', 'error');
      return;
    }

    setStatus('Gemini AI sta analizzando il documento...', 'info');

    const fieldList = Object.entries(FIELD_LABELS).map(([k,v]) => '"' + k + '" (' + v + ')').join(', ');

    const prompt = 'Sei un esperto fiscalista italiano. Analizza questo documento fiscale (CU, busta paga, ricevute) ed estrai i dati per il Modello 730.\n\nRispondi SOLO con JSON valido, nessun testo extra, nessun markdown.\nCampi: ' + fieldList + '\nAggiungi "note_ai" con breve spiegazione in italiano.\n\nEsempio: {"cognome":"Rossi","nome":"Mario","reddito_lavoro_dipendente":"35000","note_ai":"CU 2024 trovata."}';

    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mediaType, data: base64 } },
                { text: prompt }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
          })
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus('Errore API: ' + (err.error && err.error.message ? err.error.message : res.status), 'error');
        return;
      }

      const data = await res.json();
      const text = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) ? data.candidates[0].content.parts[0].text : '';
      const clean = text.replace(/```json|```/g, '').trim();

      try {
        const parsed = JSON.parse(clean);
        extractedData = parsed;
        renderResults(parsed);
      } catch (e) {
        setStatus('Risposta AI non interpretabile. Riprova con un documento piu leggibile.', 'error');
      }

    } catch (err) {
      setStatus('Errore di rete. Controlla la connessione.', 'error');
    }
  }

  function renderResults(data) {
    hide(statusEl);

    if (data.note_ai) {
      notesEl.textContent = data.note_ai;
      notesEl.className = 'ai730-notes';
      show(notesEl);
    }

    fieldsList.innerHTML = '';
    let count = 0;

    for (const [key, label] of Object.entries(FIELD_LABELS)) {
      const value = data[key];
      if (!value) continue;
      count++;
      const row = document.createElement('div');
      row.className = 'ai730-field-row';
      row.innerHTML = '<div class="ai730-field-label">' + label + '</div><input class="ai730-field-val" data-key="' + key + '" value="' + value + '" />';
      fieldsList.appendChild(row);
    }

    fieldsList.querySelectorAll('.ai730-field-val').forEach(input => {
      input.addEventListener('change', e => {
        extractedData[e.target.dataset.key] = e.target.value;
      });
    });

    if (count === 0) {
      fieldsList.innerHTML = '<div class="ai730-hint" style="padding:12px 0">Nessun campo riconosciuto nel documento.</div>';
    }

    show(resultsEl);
  }

  injectBtn.addEventListener('click', () => {
    const count = injectAll(extractedData);
    injectResult.textContent = count > 0
      ? count + ' campo/i compilati nella pagina!'
      : 'Nessun campo corrispondente trovato in questa pagina.';
    injectResult.className = count > 0 ? 'ai730-inject-ok' : 'ai730-inject-warn';
    show(injectResult);
  });

  resetBtn.addEventListener('click', () => {
    extractedData = {};
    hide(resultsEl);
    hide(notesEl);
    hide(statusEl);
    hide(injectResult);
    fileInput.value = '';
  });

})();
