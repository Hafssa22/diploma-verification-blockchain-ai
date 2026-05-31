# 🎓 Diploma Verification — Backend API (Tâche 2)

## Stack
- **Node.js + Express.js** — API REST
- **ethers.js** — Communication avec le smart contract
- **QRCode** — Génération QR codes
- **crypto (HMAC-SHA256)** — Hash des diplômes
- **express-validator** — Validation des données
- **helmet + rate-limit** — Sécurité

---

## 📁 Structure

```
backend/
├── src/
│   ├── app.js                    ← Express app (middleware, routes)
│   ├── server.js                 ← Entry point (listen)
│   ├── controllers/
│   │   └── diplomaController.js  ← Logique métier principale
│   ├── routes/
│   │   └── diplomaRoutes.js      ← Définition des endpoints + validation
│   ├── services/
│   │   ├── blockchainService.js  ← Communication avec le smart contract
│   │   ├── qrService.js          ← Génération QR codes
│   │   └── aiService.js          ← Appels vers le service IA (Tâche 3)
│   ├── middleware/
│   │   ├── errorMiddleware.js    ← Gestion globale des erreurs
│   │   └── authMiddleware.js     ← Protection API key
│   └── utils/
│       └── hashGenerator.js      ← SHA-256 + HMAC des diplômes
├── tests/
│   └── backend/
│       └── api.test.js           ← Tests Jest + Supertest
├── .env                          ← Variables d'environnement
└── package.json
```

---

## ⚡ Installation

```bash
cd backend
npm install
```

## ▶️ Lancement

```bash
# Development (avec rechargement auto)
npm run dev

# Production
npm start
```

## 🧪 Tests

```bash
npm test
```

---

## 📡 Endpoints API

| Méthode | URL | Description |
|---------|-----|-------------|
| `GET` | `/api/health` | Santé de l'API |
| `GET` | `/api/diplomas/status` | Statut blockchain + IA |
| `POST` | `/api/diplomas/add` | Ajouter un diplôme |
| `GET` | `/api/diplomas/verify/:hash` | Vérifier par hash (scan QR) |
| `POST` | `/api/diplomas/verify-data` | Vérifier par données brutes |
| `GET` | `/api/diplomas/:hash/qrcode` | Obtenir QR code |
| `GET` | `/api/diplomas/:hash` | Détails d'un diplôme |

---

## 📨 Exemples Postman

### Ajouter un diplôme (POST /api/diplomas/add)
```json
{
  "studentName": "Ahmed Benali",
  "studentId": "STU2024001",
  "degree": "Master",
  "major": "Informatique",
  "university": "Université Mohammed V",
  "graduationDate": "2024-06-15",
  "honors": "Très Bien"
}
```

### Réponse :
```json
{
  "success": true,
  "message": "Diploma successfully added to blockchain",
  "data": {
    "diplomaHash": "0xabc123...",
    "qrCode": "data:image/png;base64,...",
    "verificationUrl": "http://localhost:5173/verify/0xabc123...",
    "transaction": {
      "transactionHash": "0x...",
      "blockNumber": 42,
      "gasUsed": "50000",
      "status": "success"
    },
    "aiAnalysis": {
      "status": "valid",
      "score": 0.97
    }
  }
}
```

---

## 🔧 Configuration (.env)

```env
PORT=3000
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545   # URL Ganache
CONTRACT_ADDRESS=0xYOUR_ADDRESS              # Adresse du contrat (Tâche 1)
PRIVATE_KEY=0xYOUR_KEY                       # Clé privée pour signer
AI_SERVICE_URL=http://localhost:5000         # Service IA (Tâche 3)
HASH_SECRET=your_secret_key
```

---

## 🔗 Intégration avec les autres tâches

### Tâche 1 (Blockchain)
- Mettre à jour `CONTRACT_ADDRESS` dans `.env`
- Vérifier que l'ABI dans `blockchainService.js` correspond au contrat déployé

### Tâche 3 (IA)
- Le service IA doit exposer `POST /analyze` retournant `{ status, score, details }`
- Si le service IA est indisponible, l'API continue de fonctionner (dégradation gracieuse)

### Tâche 4 (Frontend)
- CORS configuré pour `http://localhost:5173` (Vite)
- Le QR code retourné est un `data:image/png;base64,...` directement affichable
