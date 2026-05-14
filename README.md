# 730 AI Compiler — Chrome/Firefox Extension

Carica un documento fiscale (CU, busta paga, ricevute mediche) e l'AI compila 
automaticamente i campi del Modello 730 direttamente nella pagina.

---

## Installazione

### Chrome / Edge

1. Apri Chrome e vai su: `chrome://extensions`
2. Attiva **"Modalità sviluppatore"** (toggle in alto a destra)
3. Clicca **"Carica estensione non pacchettizzata"**
4. Seleziona la cartella `730-extension`
5. L'icona 🇮🇹 apparirà nella barra degli strumenti

### Firefox

1. Apri Firefox e vai su: `about:debugging#/runtime/this-firefox`
2. Clicca **"Carica componente aggiuntivo temporaneo"**
3. Seleziona il file `manifest.json` dentro la cartella `730-extension`
4. L'estensione è attiva per questa sessione

---

## Configurazione API Key

1. Vai su https://console.anthropic.com e crea una API Key
2. Clicca sull'icona dell'estensione nella toolbar → "⚙️ Imposta API Key"
3. Incolla la chiave (inizia con `sk-ant-`) e clicca Salva
4. La chiave viene salvata localmente nel browser, mai inviata a server esterni

---

## Come si usa

1. Apri la pagina del 730 (Agenzia delle Entrate o portale CAF)
2. Clicca il pulsante **🇮🇹 730 AI** in basso a destra
3. Trascina o seleziona il tuo documento (CU, busta paga, PDF, JPG, PNG)
4. L'AI analizza il documento e mostra i campi estratti
5. Clicca **⚡ Compila Campi Pagina** per iniettare i valori nel form
6. Verifica i dati e procedi con la dichiarazione

---

## Struttura file

```
730-extension/
├── manifest.json      ← Configurazione estensione (MV3, Chrome + Firefox)
├── content.js         ← Script iniettato nella pagina (UI + AI + injection)
├── overlay.css        ← Stili del pannello flottante
├── background.js      ← Service worker (lifecycle)
├── popup.html         ← Popup toolbar con istruzioni
└── icons/             ← Icone (aggiungi icon16.png, icon48.png, icon128.png)
```

---

## Note importanti

- Questo strumento è di **supporto**: verifica sempre i dati con un CAF 
  o commercialista prima di presentare la dichiarazione
- La API Key di Anthropic è necessaria e a carico dell'utente
- I documenti vengono inviati direttamente all'API di Anthropic, 
  non passano per nessun server intermedio
