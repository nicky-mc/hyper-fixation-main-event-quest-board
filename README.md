# ⚔️ Hyper-Fixation Main Event: Quest Board

**Repository:** `hyper-fixation-main-event-quest-board`  
**Deployment Engine:** Powered by [Base44](https://base44.com)

Welcome to the central hub for the **Hyper-Fixation Main Event**. This is a specialized social-RPG platform designed with a high-fidelity **LCARS** (Library Computer Access and Retrieval System) aesthetic. It transforms community interaction into a multi-sector questing experience.

---

## 🛰️ Current Systems (Active)

The following modules are currently operational within the sector:

* **Personnel Records (Adventurer Profiles):** Complete profile management including Bio, Realm (Location), and Class assignments (Novice to Legendary).
* **The Comms Log:** A specialized social wall for dimensional transmissions, supporting text and media posts from verified adventurers.
* **Sub-Space Feed (Live Activity):** A real-time drawer component tracking every quest submission and lore drop across the network.
* **The Artifact Vault:** A visual inventory system that displays earned trophies and quest rewards.
* **Quest-Integrated Lore:** Ability to "drop lore" (comment) on specific quests, creating a persistent history for every objective.
* **Privacy Shield:** Integrated privacy levels (Public, Friends-Only, Private) to protect adventurer data.

---

## 📅 Roadmap: Future Transmissions 

*Reminders for when the 16-day credit lockout expires:*

1.  **Enhanced Comms Log:** Implement "String Injection" or schema updates to allow **media uploads within comments**.
2.  **Interaction Matrix:** Add "Lore Checks" (Likes/Votes) and "Reaction" icons to wall posts.
3.  **Real-Time Comms:** Refine the `Messages` system for direct 1-on-1 adventurer-to-adventurer transmissions.
4.  **Notification Hub:** A dedicated LCARS-styled panel for friend requests, quest completions, and wall mentions.
5.  **Global Quest Map:** A visual, interactive map interface for selecting active Quest nodes.

---

## 🛠️ Local Development Setup

To run this sector in your local environment, follow these protocols:

### 1. Initialize the Sector
```
git clone [https://github.com/nicky-mc/hyper-fixation-main-event-quest-board.git](https://github.com/nicky-mc/hyper-fixation-main-event-quest-board.git)
cd hyper-fixation-main-event-quest-board
npm install
```
### 2. Environment Configuration
Create an `.env.local` file in the root directory and input your Base44 credentials:

```env
VITE_BASE44_APP_ID=your_app_id_here
VITE_BASE44_APP_BASE_URL=your_backend_url_here
```
🛰️ Synchronizing with Base44
Continuous Integration: Any push to the main branch is automatically synced to the Base44 Builder.

Deployment: To take changes live, open the Base44 Dashboard and click Publish.

📚 Docs & Support
Base44 Documentation: GitHub Integration Guide

Sector Support: Base44 Support Portal
