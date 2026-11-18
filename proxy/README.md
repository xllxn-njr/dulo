# Dulo Custom InnerTube Proxy (`youtubei.js`)

Optional self-hosted stream & search backend for **Dulo**. By default, Dulo runs in **Direct Browser Mode** via public Piped API instances with automatic failover. When you want dedicated zero-rate-limit InnerTube extraction with HTTP Range byte-serving:

```bash
cd proxy
npm install
npm start
```

Then open **Settings -> Stream Engine** in Dulo, switch to **Custom InnerTube Proxy**, and enter `http://localhost:4000` (or your deployed proxy URL).
