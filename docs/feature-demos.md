# Feature Demos

---

## #26 — shadcn-vue Migration

UI-Komponenten (Button, Card, Switch, Input, Checkbox, Radio, Select, Badge) durch wiederverwendbare shadcn-vue Bausteine ersetzt. Keine visuellen oder funktionalen Aenderungen - nur sauberer, einheitlicher Code unter der Haube.

### Demo

1. **Settings** — Zahnrad oben rechts. Alle 7 Toggles durchklicken (Dark Mode, Show Answers, Show Labels, etc.). Export/Import und Audio-Speed Buttons testen.
2. **Dark Mode** — In Settings aktivieren, dann durch Home → Lessons → Lektion → Learning Items navigieren. Alles sollte einheitlich dunkel sein.
3. **Home** — Sprache waehlen, Topic waehlen, "Load Lessons" klicken.
4. **Lessons-Uebersicht** — Hover ueber Lesson-Cards. "Assessment Results" Button testen.
5. **Lektion mit Assessments** — Text-Eingabe (Enter), Multiple-Choice (Checkboxen), Single-Choice (Radio) durchklicken. Gruen/rot Feedback pruefen.
6. **Learning Items** — Lesson-Filter Dropdown, "Group by Status"/"Group by Lesson" Checkboxen, Items als gelernt markieren.
7. **Mobile** — Browser-Fenster schmal ziehen. Floating Play-Button unten rechts pruefen.

---

## #27 — Store Progress and Assessment Results (GunDB Sync)

Lernfortschritt, Assessment-Antworten und Einstellungen werden ueber GunDB zwischen Geraeten/Tabs synchronisiert. Verschluesselte User-Accounts via SEA, kein Server noetig — laeuft komplett im Browser (Multicast im selben Netzwerk).

### Demo

1. **Register** — Settings oeffnen → Username + Passwort eingeben → "Register" klicken → Erfolgsmeldung.
2. **Sync nach Login** — Abmelden, Vokabeln lernen, wieder einloggen → Fortschritt wird gemergt.
3. **Cross-Tab Sync** — Tab 1: eingeloggt, Vokabel lernen → Tab 2: einloggen → Fortschritt ist da.
4. **Sync Now** — Manuell "Sync Now" klicken → bestaetigt Sync.
5. **Offline** — Ohne Login arbeiten → App funktioniert wie bisher (nur localStorage).
6. **Logout** — "Logout" klicken → Account-Sektion zeigt Login-Formular.
