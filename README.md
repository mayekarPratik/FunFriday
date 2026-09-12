# FunFriday 🐺 - Social Deduction Engine

A Jackbox-style real-time multiplayer social deduction game engine built with TypeScript, Express, Socket.io, Redis, React, Vite, and Zustand.

## 📱 How It Works (The Jackbox Model)
FunFriday is designed for same-room party play. 
* **The Host:** One device (usually a laptop connected to a TV) acts as the public scoreboard, narrator, and timer. It does not hold any secret information.
* **The Players:** Up to 8 players join the room via a 4-letter code on their mobile web browsers. Their phones act as secret, private controllers.
* **Zero App Downloads:** Because it runs entirely in the mobile browser, friction to play is zero. The UI uses strict Native Web constraints (no pull-to-refresh, no pinch-to-zoom, and Wake Lock API) to feel exactly like a native app.

## 🎭 The Default 8-Player Setup
The engine is highly customizable, but ships with a finely balanced 8-player default configuration:
* **1x Werewolf:** The informed minority. Silently eliminates one player each night.
* **1x Seer:** Inspects one player's true alignment each night.
* **1x Doctor:** Protects one player from elimination each night.
* **1x Witch:** Holds a single-use healing potion and a single-use poison potion.
* **1x Hunter:** If eliminated, immediately fires a parting shot to take someone down with them.
* **1x Cupid:** Links two players as "Lovers" on Night 1. If one dies, the other dies of grief.
* **1x Bear Tamer:** If the Werewolf is sitting physically next to them, the Host screen growls at daybreak.
* **1x Villager:** The standard baseline human to provide a safe bluff for the Werewolf.

---

## 🚀 Quick Start (Run Both Frontend & Backend)

From the project root:

```bash
# 1. Install all dependencies
npm install
npm install --prefix backend
npm install --prefix frontend

# 2. Run both Frontend and Backend concurrently
npm run dev