# 📦 EngMapStore

> Online repository for Java programs — Login with GitHub, admin review, anti-spam.

**Live:** [your-app.vercel.app](https://your-app.vercel.app)

---

## ✨ Features

- 🔐 **Login with GitHub OAuth**
- 📤 **Upload your `.jar` programs** — queued for review
- ✅ **Admin panel** — approve/reject submissions, manage users
- 🛡️ **Anti-spam** based on GitHub (not IP):
  - GitHub account must be ≥ 5 days old
  - At least 1 public repository
  - Max 2 submissions every 24h
  - Max 2 submissions pending at the same time
- ⭐ **Whitelist** for verified users (no limit)
- 🚫 **Blacklist** for admins to ban users

---

## 🏗️ Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React 18 + Vite         |
| Hosting  | Vercel (serverless)     |
| Database | Supabase (PostgreSQL)   |
| Storage  | Supabase Storage        |
| Auth     | GitHub OAuth 2.0 + JWT  |

**Cost: $0** — everything on free plans.

---

## 🚀 Setup

See [`jarstore-online/README.md`](./jarstore-online/README.md) for complete deploy instructions.

---

## 👥 Contributors

| | Username | Role |
|---|---|---|
| <img src="https://github.com/CosmoUniverso.png" width="24"/> | [@CosmoUniverso](https://github.com/CosmoUniverso) | Lead Developer |
| <img src="https://github.com/gabrielerada07.png" width="24"/> | [@gabrielerada07](https://github.com/gabrielerada07) | Collaborator |
