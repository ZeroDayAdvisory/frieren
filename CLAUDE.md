# Frieren

Micro-framework for security gadgets on OpenWrt routers/SBCs. PHP backend + React frontend.
Licensed LGPL-3.0-only. Lead dev: DSR! (xchwarze@gmail.com).

## Project Structure

```
frieren/
├── frieren-back/          # PHP API backend (micro-framework)
├── frieren-front/         # React SPA frontend (Vite)
├── frieren-module-template/ # Scaffolding for third-party modules
├── frieren-terminal/      # Modified ttyd frontend (xterm.js)
└── tools/                 # Dev proxy + PHP minifier
```

## Components

### Backend (`frieren-back/`)
PHP micro-framework. JSON POST API with session auth + CSRF. Modular architecture — each feature is a module with controller + OS helper. See **`frieren-back/CLAUDE.md`** for full detail.

**Key:** All requests are `POST /api/index.php` with `{module, action, ...params}`.

### Frontend (`frieren-front/`)
React 18 SPA (Vite 5, no TypeScript). Feature-based structure with Wouter routing, Jotai state, React Query data fetching. Supports dynamic UMD modules. See **`frieren-front/CLAUDE.md`** for full detail.

**Key:** Hash-based routing (`#/dashboard`, `#/modules`, etc.). All API calls via `fetchPost()`.

### Module Template (`frieren-module-template/`)
Scaffolding for creating third-party modules. Includes example controller, helper, manifest, and Vite config for building UMD frontend bundles.

### Terminal (`frieren-terminal/`)
Modified ttyd web terminal frontend. Webpack + TypeScript + xterm.js. Builds inlined HTML (`html.h`) for the ttyd C binary.

### Tools (`tools/`)
- **`api-proxy.php`** — Dev proxy for frontend: forwards `/api/*` requests from Vite dev server to hardware device at `192.168.7.1:5000`. Handles PHPSESSID/XSRF-TOKEN cookie forwarding. Run with `php -S localhost:8000`.
- **`api-test.sh`** — CLI helper for testing backend APIs via curl. Manages login session (cookies/XSRF). Usage: `./api-test.sh login` then `./api-test.sh req '{"module":"...","action":"..."}'`. Supports `-s SLEEP` for polling, `-o FILE` for saving response.
- **`deploy.sh`** — Deploys backend or frontend to device via SCP. Usage: `./deploy.sh back|front [host] [password]`. Backend deploys `api/` core + `modules/` to `/usr/share/frieren`. Frontend builds prod, compresses assets, and deploys `dist/`.
- **`ssh-cmd.sh`** — Run a command on device via SSH. Usage: `./ssh-cmd.sh "command" [host] [password]`. Uses SSH_ASKPASS for non-interactive password auth.
- **`api-clean.php`** — PHP comment/whitespace stripper for production builds.

## Architecture Overview

```
Browser (React SPA)
  ↓ JSON POST {module, action, ...params}
/api/index.php → ApiCore → Router → {Module}Controller → ModuleOpenWrtHelper
  ↓                                                        ↓
ResponseHandler (JSON)                              OpenWrt system commands
```

- **Auth:** Session-based + CSRF cookie token
- **Modules:** Discoverable via `manifest.json`, installable from remote GitHub repo
- **Storage:** Internal (`/frieren/modules/`) or SD card (`/sd/modules/`)
- **Config:** UCI (OpenWrt Unified Configuration Interface)
- **Platform:** OpenWrt only (extensible via `HelperInterface`)

## Development

```bash
# Frontend dev (from frieren-front/)
yarn dev

# Backend proxy (from tools/)
php -S localhost:8000

# Production build (from frieren-front/)
yarn build

# Release build (from frieren-front/)
yarn build --mode release
```

## Module Development

Each module needs:
1. `{Name}Controller.php` — extends `\frieren\core\Controller`, defines `$endpointRoutes`
2. `ModuleOpenWrtHelper.php` — static methods for OS-level operations
3. `manifest.json` — metadata (name, title, icon, version, etc.)
4. Optional: UMD frontend bundle built with `frieren-module-template`

Third-party modules go in `frieren-modules` repo.

---

## ZeroDay Advisory™ Pentest Build — Working Notes

This is an authorized pentest/wardriving rig running on a **GL.iNet GL-MT6000** (hostname `PATCH-MGMT-01`, IP `192.168.8.1`). All offensive actions are scoped to the user's own gear plus an explicit allow-list.

### Router Access

```bash
# SSH shortcut (uses SSH_ASKPASS pattern)
bash ~/frieren/tools/ssh-cmd.sh "command" 192.168.8.1 '$ROUTER_PASS'

# SCP pattern (all assets go to /usr/share/frieren/)
PASS='$ROUTER_PASS'; HOST='192.168.8.1'
ASKPASS=$(mktemp); chmod +x "$ASKPASS"; printf '#!/bin/sh\necho "%s"\n' "$PASS" > "$ASKPASS"
DISPLAY=:0 SSH_ASKPASS="$ASKPASS" SSH_ASKPASS_REQUIRE=force scp -O -o StrictHostKeyChecking=no FILE root@$HOST:/path
rm -f "$ASKPASS"
```

The router panel runs at `http://192.168.8.1:5000`. Frieren framework files live at `/usr/share/frieren/`. USB storage (modules + Aura data) mounts at `/mnt/usb/`.

### Aura Daemon

Closed-source paid WiFi recon/offense daemon. Data lives in `/mnt/usb/frieren/aura/`:
- `recon.db` — SQLite: tables `aps`, `clients`; latest scan queryable with `MAX(scan_id)`
- `allow.db` — SQLite `allow_list` table (MAC addresses authorized for deauth/MITM)
- `hooks.d/` — PHP scripts run by Aura on events

**Scope rules (hard):** Deauth and MITM are restricted to devices on the allow-list. Auto-MITM certificate push only applies to allow-listed devices, never any device that randomly joins the honeypot.

### Honeypot AP

SSID: **`<honeypot-ssid>`** · BSSID: `AA:BB:CC:DD:EE:FF` · Network: `10.13.37.0/24` · Bridge: `br-evil`

MITM watcher hook: `/mnt/usb/frieren/aura/hooks.d/honeypot-mitm-watch.php`  
Runs every 30 s via two crontab entries. Checks all currently-connected allow-listed devices for a live Bettercap process and self-heals crashed sessions. Bettercap + tcpdump recordings go to `/mnt/usb/frieren/aura/captures/`.

### Telegram Bot

Bot: `@<your-notifications-bot>` · Chat ID: `<your-telegram-chat-id>`  
Token stored in Aura UCI. Bot file: `/mnt/usb/frieren/aura/hooks.d/aura-status-bot.php`  
Commands: `/newaps`, `/search <ssid>`, `/recon`, `/status`, `/settings` (sends unredacted UCI config — private bot, single operator).  
Vendor enrichment uses Kismet's OUI DB at `/usr/share/frieren/modules/kismet/conf/kismet_manuf.txt.gz`.

### Radio Layout (GL-MT6000)

| Radio | Band | Role |
|-------|------|------|
| radio0 | 2.4 GHz | Monitor (recon scanning) |
| radio1 | 5 GHz | Monitor (recon scanning) |
| radio2 | 6 GHz | (available) |
| radio3 | 2.4 GHz | AP — LAN + honeypot |
| radio4 | 5 GHz | AP — LAN |

### macfilter Module (Custom)

Located at `macfilter-module/` (this repo). Built with the frieren-module-template stack.

**What it does:** View/add/remove MAC addresses on Aura's shared allow-list. Shows enriched vendor info. Displays recon scan results (249 APs, vendor-enriched, expandable client rows).

**Color scheme (enforced):**
- Neon pink `#ff2d78` — allow-listed MACs, SSID names, vendor names
- Light blue `#7dd3fc` — BSSIDs and device MACs in recon results, vendor/hostname subtitle

Import from `src/colors.js` via `import { PINK, BLUE } from '@module/colors'`. Never hardcode hex values.

**Build + deploy:**
```bash
cd ~/tools/frieren-repo/macfilter-module
yarn build
# Then SCP dist/* to /usr/share/frieren/modules/macfilter/
```

**Backend files on router:**
- `/usr/share/frieren/modules/macfilter/MacfilterController.php`
- `/usr/share/frieren/modules/macfilter/ModuleOpenWrtHelper.php`

### Custom Module Logos (Sidebar Icons)

All five custom-logo modules use **pink+white duotone** icons (dark areas → white, light areas → `#ff2d78` pink). Logos live at `/home/nullbytes/Pictures/Frieren Module Logo's/`.

**To regenerate + redeploy logos:**
```bash
SVGS="/home/nullbytes/tools/frieren-repo/assets/module-icons"
OUT="/tmp/module-icons"
mkdir -p "$OUT"
# macfilter, bettercap, wireshark, mdk4: custom SVG sources
# SVGs: black background → pink (#ff2d78), white shapes → white
for name in macfilter bettercap wireshark mdk4; do
  convert "${SVGS}/${name}-src.svg" -colorspace Gray -background white -flatten \
    -resize 128x128 \( -size 256x1 gradient:'#ff2d78-white' \) -clut \
    "${OUT}/${name}-icon.png"
done
# kismet: use original PNG (invert black symbol to white, then duotone)
LOGOS="/home/nullbytes/Pictures/Frieren Module Logo's"
convert "${LOGOS}/Kismet Logo.png" \
  -fuzz 5% -transparent white -negate \
  -background black -flatten \
  -colorspace Gray -background white -flatten -resize 128x128 \
  \( -size 256x1 gradient:'#ff2d78-white' \) -clut \
  "${OUT}/kismet-icon.png"
# Then SCP each ${name}-icon.png → root@192.168.8.1:/usr/share/frieren/modules/${name}/icon.png
# manifest.json on router already has "icon": "icon.png" for all five
```

### CSS Customizations on Router

The router's main CSS is at `/usr/share/frieren/assets/index.css` and is **gzip-compressed**.

**To modify CSS:**
1. Download and extract: `scp … index.css /tmp/index.css.gz && gunzip -c /tmp/index.css.gz > /tmp/index.css.plain`
2. Append rules to `/tmp/index.css.plain`
3. Recompress: `gzip -9 -c /tmp/index.css.plain > /tmp/index.css.new.gz`
4. Upload: `scp /tmp/index.css.new.gz root@192.168.8.1:/usr/share/frieren/assets/index.css`

**Current custom rules appended (hash-routing selectors):**
```css
#sidebar a[href='#/macfilter'], #sidebar a[href='#/kismet'],
#sidebar a[href='#/bettercap'], #sidebar a[href='#/wireshark'],
#sidebar a[href='#/mdk4'] { color: #ff2d78 !important; }
```

### CSRF / fetchPost Bug Class

Frieren's `fetchPost()` in hooks sends CSRF token via `X-XSRF-TOKEN` header, but PHP reads it from `$_COOKIE['XSRF-TOKEN']`. Workaround: pass the XSRF token explicitly in the POST body or use the `api-test.sh` tool which handles cookie forwarding correctly.

### Key File Paths on Router

| Path | Purpose |
|------|---------|
| `/usr/share/frieren/` | All frieren files (PHP API + module bundles) |
| `/usr/share/frieren/assets/index.css` | Main CSS (gzip-compressed) |
| `/usr/share/frieren/modules/{name}/` | Per-module files |
| `/mnt/usb/frieren/aura/` | Aura daemon data + hooks |
| `/mnt/usb/frieren/aura/recon.db` | SQLite recon scan data |
| `/mnt/usb/frieren/aura/allow.db` | SQLite allow-list |
| `/mnt/usb/frieren/aura/hooks.d/` | PHP event hooks |
| `/mnt/usb/frieren/aura/captures/` | Bettercap/tcpdump recordings |
| `/etc/crontabs/root` | Cron jobs (MITM watcher runs every 30 s) |
