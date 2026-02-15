# Orbita — TODO UI/UX

## Priorità Alta

- [ ] **Breadcrumb navigation** — Aggiungere breadcrumb nel header (es. Projects > Website Redesign > Tasks)
- [ ] **Mobile tables** — Card view su schermi piccoli invece di scroll orizzontale
- [ ] **Kanban mobile** — Stack colonne verticalmente su mobile, swipe orizzontale
- [ ] **Form validation inline** — Errori sotto i campi, validazione real-time (URL, email, date)
- [ ] **Loading skeletons** — Aggiungere skeleton loader a project detail, tasks, branding, invoice detail

## Priorità Media

- [ ] **Stats dashboard** — Calcolare trend reali (vs mese precedente) invece dei +12.5% hardcoded
- [ ] **Rimuovere SectionCards** — Componente demo inutilizzato con dati falsi
- [ ] **Empty states Kanban** — Messaggio nelle colonne vuote con CTA
- [ ] **Time entry edit** — Permettere modifica entry, non solo cancellazione
- [ ] **Invoice conferma PAID** — Chiedere conferma prima di segnare fattura come pagata
- [ ] **Bulk actions** — Selezione multipla su tabelle (delete, export, cambio stato)
- [ ] **Export CSV** — Esportazione dati da tutte le tabelle (clienti, progetti, fatture, ore)
- [ ] **Due date in tabella fatture** — Colonna data scadenza visibile nella lista
- [ ] **Timer pause/resume** — Aggiungere pausa oltre a start/stop
- [ ] **Colonne vuote Kanban** — Mostrare messaggio "No tasks" con icona

## Priorità Bassa

- [ ] **PDF preview** — Anteprima fattura prima del download
- [ ] **Template fatture** — Salvare line items ricorrenti come template riutilizzabili
- [ ] **Confronto periodi analytics** — Comparare periodo attuale vs precedente
- [ ] **Keyboard shortcuts** — Scorciatoie per azioni comuni (Ctrl+N nuovo, Ctrl+S salva)
- [ ] **Activity log** — Timeline delle azioni su progetto (chi ha fatto cosa e quando)
- [ ] **Forgot password** — Flow reset password nella pagina login
- [ ] **Notifications** — Sistema notifiche per fatture scadute, task in ritardo
- [ ] **Tooltips troncamento** — Mostrare testo completo su hover per nomi troncati
- [ ] **Test API settings** — Bottone "Test Connection" per verificare API key
- [ ] **Timer history** — Mostrare ultimi timer per riavvio rapido

## Note Tecniche

- Tabelle: usano `@tanstack/react-table`, il card view mobile richiede un layout alternativo condizionale
- Kanban: usa `@dnd-kit`, su mobile serve touch activation con long-press
- Form validation: valutare `zod` per schema validation client+server
- Export: `papaparse` per CSV, oppure generazione server-side
- Skeletons: il pattern `loading.tsx` di Next.js è già usato sulla dashboard, estenderlo alle altre pagine
