# 📦 EngMapStore

> Online repository for Java programs with role system, admin review, and anti-spam.

**Live:** [tpsit-demo-lab.vercel.app](https://tpsit-demo-lab.vercel.app)  
**Repo:** [github.com/CosmoUniverso/EngMapStore](https://github.com/CosmoUniverso/EngMapStore)

---

## ✨ Features

- 🔐 **Login with GitHub OAuth**
- 📤 **Upload `.jar` programs** — queued for admin review
- ✅ **Admin panel** — approve/reject programs and new users
- 🛡️ **Anti-spam** based on GitHub (not IP, not bypassable with VPN):
  - GitHub account must be ≥ 5 days old
  - At least 1 public repository
  - Max 1 project awaiting review at a time
- 📊 **Storage monitor** with automatic warning when limits are reached
- 📱 **Responsive** — optimized for mobile and desktop

---

## 👥 Role System

| Role | How to obtain | Approved projects | Pending |
|---|---|---|---|
| `pending` | On first login | 0 | — |
| `active` | Approved by admin | max 2 | max 1 |
| `whitelisted` | Promoted by admin | max 5 | unlimited |
| `admin` | Promoted by superadmin | unlimited | unlimited |
| `superadmin` | CosmoUniverso (fixed) | unlimited | unlimited |
| `banned` | Banned by admin | 0 | — |

> New accounts receive a welcome popup explaining they must wait for admin approval before uploading.

---

## 🔒 Limits & Security

- **Max 40 users** total (excluding banned)
- **Storage:** automatic block with safety margin at 850MB out of 1GB free
- **Superadmin** (`CosmoUniverso`) cannot be modified, demoted or banned by anyone
- Only the superadmin can promote/demote other admins

---

## 🏗️ Stack — 100% free

| Service | What it does | Free plan limit |
|---|---|---|
| Vercel | Frontend + serverless API | Unlimited |
| Supabase | PostgreSQL + Storage .jar | 500MB DB · 1GB Storage |
| GitHub OAuth | Authentication | Unlimited |

**Total cost: $0**

---

## 🚀 Setup

### 1. Supabase
1. Create project on **supabase.com**
2. **SQL Editor** → paste `supabase-schema.sql` → Run
3. **Storage** → New bucket → name `jars` → do NOT check Public
4. Copy URL, `anon key` and `service_role key`

### 2. GitHub OAuth App
1. **github.com/settings/developers** → New OAuth App
2. Homepage URL: `https://your-app.vercel.app`
3. Callback URL: `https://your-app.vercel.app/api/auth/callback`
4. Copy Client ID and Client Secret

### 3. Vercel
```bash
npm i -g vercel
cd jarstore-online
vercel
```

Environment variables to set on Vercel:

```env
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
JWT_SECRET=random_string_32_characters
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
APP_URL=https://your-app.vercel.app
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_URL=https://your-app.vercel.app
```

---

## 📁 Project Structure

```
jarstore-online/
├── api/
│   ├── _utils.js              ← shared helpers
│   ├── me.js                  ← GET user profile
│   ├── upload-url.js          ← POST presigned upload URL
│   ├── auth/
│   │   ├── github.js          ← OAuth redirect
│   │   └── callback.js        ← callback → JWT + user limit
│   ├── programs/
│   │   ├── index.js           ← GET approved programs
│   │   ├── submit.js          ← POST submission with all checks
│   │   └── download.js        ← GET signed download URL
│   └── admin/
│       ├── queue.js           ← GET program queue + pending users
│       ├── review.js          ← POST approve/reject program
│       ├── users.js           ← GET/PATCH user management
│       ├── stats.js           ← GET statistics + storage
│       └── contributors.js   ← GET public admin list
└── src/
    ├── pages/
    │   ├── Login.jsx          ← login with detailed error messages
    │   ├── Home.jsx           ← program list + welcome popup
    │   ├── Submit.jsx         ← direct upload to Supabase + collaborators field
    │   ├── Admin.jsx          ← unified queue + users + storage stats
    │   ├── Contributors.jsx   ← contributors + live admins from DB
    │   └── AuthCallback.jsx
    └── components/
        ├── Navbar.jsx         ← responsive mobile
        └── ProgramCard.jsx    ← shows uploader and collaborators
```

---

## 👥 Contributors

| | Username | Role |
|---|---|---|
| <img src="https://github.com/CosmoUniverso.png" width="20"/> | [@CosmoUniverso](https://github.com/CosmoUniverso) | Lead Developer & Superadmin |
| <img src="https://github.com/gabrielerada07.png" width="20"/> | [@gabrielerada07](https://github.com/gabrielerada07) | Collaborator |
