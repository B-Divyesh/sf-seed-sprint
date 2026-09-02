# Seed Sprint demo

- URL: `https://seed-sprint.sociobot.in/demo` (local: `http://localhost:5173/demo`).
- Sample: the fixed `SPROUT-7` board starts 42 seconds in, with 11 turns and eight route tiles already aligned.
- Reset: use **Reset demo** in the persistent demo banner or on the result screen.
- Exit: **Start for real** opens today’s board. Demo data is ignored outside demo mode.
- Storage: every demo key begins with `demo:`. Daily play uses keys beginning with `daily:`. The two namespaces are never read together.
- Network: no account or API is required. The installed service worker makes the demo available after the first visit.
