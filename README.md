# 📦 JarStore — Software Repository

Piattaforma per caricare, scaricare e gestire programmi Java `.jar`.
Login con **GitHub OAuth**, admin riservato a `CosmoUniverso`.

---

## Stack

| Layer    | Tecnologia                            |
|----------|---------------------------------------|
| Frontend | React 18 + Vite + react-router-dom   |
| Backend  | Node.js + Express                     |
| Database | SQLite locale (`better-sqlite3`)      |
| Auth     | GitHub OAuth 2.0 → JWT               |
| Upload   | Multer (drag & drop `.jar`)           |

---

## ⚙️ Setup

### 1. Crea una GitHub OAuth App

1. Vai su → **https://github.com/settings/developers**
2. Click **"New OAuth App"**
3. Compila così:

   | Campo                       | Valore                                      |
   |-----------------------------|---------------------------------------------|
   | Application name            | JarStore                                    |
   | Homepage URL                | `http://localhost:5173`                     |
   | Authorization callback URL  | `http://localhost:3001/auth/github/callback`|

4. Click **"Register application"**
5. Copia **Client ID** e genera un **Client Secret**

---

### 2. Configura il backend

```bash
cd backend
cp .env.example .env
```

Apri `.env` e inserisci le credenziali GitHub:

```env
GITHUB_CLIENT_ID=il_tuo_client_id
GITHUB_CLIENT_SECRET=il_tuo_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
JWT_SECRET=una_stringa_random_sicura_lunga
FRONTEND_URL=http://localhost:5173
PORT=3001
```

---

### 3. Installa le dipendenze

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 4. Avvia il progetto

Apri **due terminali**:

**Terminale 1 — Backend:**
```bash
cd backend
npm run dev
# oppure: npm start
```

**Terminale 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Apri il browser su → **http://localhost:5173**

---

## 🔐 Permessi

| Azione                        | Utente | Admin (`CosmoUniverso`) |
|-------------------------------|--------|--------------------------|
| Login con GitHub              | ✅     | ✅                        |
| Vedere i programmi            | ✅     | ✅                        |
| Scaricare `.jar`              | ✅     | ✅                        |
| Caricare programmi (drag&drop)| ❌     | ✅                        |
| Eliminare programmi           | ❌     | ✅                        |
| Vedere statistiche            | ❌     | ✅                        |

---

## 📁 Struttura progetto

```
jarstore/
├── backend/
│   ├── server.js          ← Express API + OAuth + SQLite
│   ├── .env.example       ← Template variabili d'ambiente
│   ├── package.json
│   ├── jarstore.db        ← Database SQLite (auto-generato)
│   └── uploads/           ← File .jar caricati (auto-generato)
│
└── frontend/
    ├── src/
    │   ├── App.jsx              ← Router principale
    │   ├── main.jsx
    │   ├── index.css            ← Design system globale
    │   ├── hooks/
    │   │   ├── useAuth.jsx      ← Context auth + apiFetch
    │   │   └── useToast.js      ← Notifiche toast
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── ProgramCard.jsx
    │   │   └── ToastContainer.jsx
    │   └── pages/
    │       ├── Login.jsx        ← Pagina login GitHub
    │       ├── AuthCallback.jsx ← Handler OAuth callback
    │       ├── Home.jsx         ← Lista programmi
    │       └── Admin.jsx        ← Upload + gestione (solo admin)
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Deploy in produzione

Per il deploy, aggiorna queste variabili in `.env`:

```env
GITHUB_CALLBACK_URL=https://tuodominio.com/auth/github/callback
FRONTEND_URL=https://tuodominio.com
```

E aggiorna anche l'**Authorization callback URL** nella tua GitHub OAuth App.

---

## 📝 Note

- Il database SQLite viene creato automaticamente al primo avvio in `backend/jarstore.db`
- I file `.jar` caricati vengono salvati in `backend/uploads/`
- Il riconoscimento admin si basa sul **username GitHub esatto**: `CosmoUniverso`
- Limite upload: **200 MB** per file
