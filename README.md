# Rally Provo

A sports-matching app for finding people to play with around Provo: swipe to match players, chat, plan games, browse courts and reels, and track daily challenges and stats.

## Run it

Double-click `index.html` to open it in your browser. No install or build step needed.

If you'd rather serve it locally (recommended once you add a backend):

```
npx serve .
# or
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Files

- `index.html` – page structure, navigation, modal and toast containers
- `styles.css` – all styling, with light and dark themes driven by CSS variables at the top
- `app.js` – data, logic and every screen

## How `app.js` is organized

1. **Helpers** – date formatting, escaping, icons
2. **Reference data** – sports, courts, sample players, challenges, reels
3. **Store + API** – the only place data is read or saved
4. **Illustrations** – court drawings used for cards and covers
5. **Navigation** – routing between screens (`#home`, `#play`, `#messages`, …)
6. **Views** – one render function per screen
7. **Modals, sheet, toast**
8. **Events** – one shared click, submit and keyboard handler
9. **Boot**

## Data and saving

Everything is saved in the browser's `localStorage` under the key `rally.provo.v1`, so it's per browser and per device. Use **Profile → Reset all app data** to go back to the sample data.

## Connecting a real backend

Every screen goes through the async `api` object in section 3. To move to a server (Supabase, Firebase, or your own), rewrite each `api` method to call it. For example:

```js
async send(id, text) {
  const res = await fetch(`/api/conversations/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}
```

The views already `await` these calls, so they don't need to change. You can then delete `seed()`, the `store`, and `api.demoReply` (the canned replies).

## Notes

- Players, courts, history and community numbers are sample data.
- Avatars are initials and reel covers are drawn court illustrations; swap in real photos and video once uploads exist.
- Fonts load from Google Fonts and fall back to system fonts offline.
