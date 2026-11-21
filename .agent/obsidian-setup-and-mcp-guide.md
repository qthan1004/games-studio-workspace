# Huong Dan Cai Dat, Cau Hinh & Su Dung Obsidian Cho Developer Va AI Agent

> **Muc tieu:** Tai lieu quy chuan ky thuat doc lap (Self-contained Playbook). Bat ky Developer hoac AI Agent nao (tai bat ky IDE nao nhu Antigravity, Cursor, Windsurf, VS Code + Cline/Roo-Code, Claude Code, Claude Desktop) chi can doc bang thong so va lam theo cac buoc la co the tai lap 100% moi truong Obsidian + Global Vault + MCP Server giong y het he thong hien tai.
>
> **Phien ban:** 1.2.0 | **Ngay cap nhat:** 2026-10-06 | **Moi truong chuan:** Da nen tang (Windows / macOS / Linux)

---

## 1. Bang Thong So Ky Thuat Cot Loi (Quick-Reference Matrix)

Agent hoac Developer chi can doi chieu bang nay de dien dung thong so vao moi truong cua minh:

| Thanh phan | Thong so chuan | Vi tri file / Bien moi truong | Ghi chu quan trong |
| :--- | :--- | :--- | :--- |
| **Obsidian App** | v1.14.4+ | `%LOCALAPPDATA%\Programs\Obsidian\Obsidian.exe` (Win) | Cai qua winget, brew, hoac GitHub |
| **Workspace Root** | `<WORKSPACE_ROOT>` | Thu muc chua tat ca repositories cua ban | Vi du: `D:\workspaces`, `~/projects` |
| **Global Vault Root** | `<WORKSPACE_ROOT>\global-vault` | Thu muc trung tam chua Vault | Gom tat ca wiki cua cac repo |
| **Local REST API Plugin** | v5.4.0 (Coddingtonbear) | `<VAULT>\.obsidian\plugins\obsidian-local-rest-api` | Bridge HTTPS cho Agent giao tiep |
| **Local REST API Port** | `27124` (HTTPS) | `https://127.0.0.1:27124` | Port REST API cuc bo tren may |
| **API Key Chuan** | `5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8` | File `data.json` cua plugin | Bearer token cho MCP va healthcheck |
| **MCP Server Package** | `mcp-obsidian-extended` | NPM package (chay qua `npx -y`) | 39 tools tra cuu, tim kiem, doc ghi |
| **Bien moi truong bat buoc** | `NODE_TLS_REJECT_UNAUTHORIZED=0` | MCP Server `env` | Bo qua loi self-signed cert localhost |
| **Co che noi Repo (Win)** | Windows Directory Junction | `mklink /J "<VAULT>\<REPO>" "<REPO_PATH>\.agent-wiki"` | Zero-disk clone, sync 2 chieu tuc thi |
| **Co che noi Repo (Unix)**| POSIX Symbolic Link | `ln -s "<REPO_PATH>/.agent-wiki" "<VAULT>/<REPO>"` | Tuong duong tren macOS va Linux |
| **Auto-open Config** | File he dieu hanh cua Obsidian | `%APPDATA%\obsidian\obsidian.json` | Obsidian tu mo thang Vault khi bat |

---

## 2. So Do Kien Truc He Thong (Architecture Overview)

```text
[TANG 1: REPOSITORY LEVEL - GIT TRACKED]
Moi repo chua tri thuc ky thuat tai: <PATH_TO_REPO>/.agent-wiki/
(Vi du: <WORKSPACE_ROOT>/paymenthub-checkout-web/.agent-wiki)
   |
   | Windows Directory Junction (mklink /J) hoac Unix Symlink (ln -s)
   v
[TANG 2: GLOBAL OBSIDIAN VAULT - LOCAL WORKSPACE]
<WORKSPACE_ROOT>/global-vault/
   |-- paymenthub-checkout-web/  <== [Link truc tiep sang repo/.agent-wiki]
   |-- rsa-web/                 <== [Link truc tiep sang repo/.agent-wiki]
   |-- .obsidian/               <== [Settings, Core & Community Plugins]
   |   `-- plugins/obsidian-local-rest-api/ (Chay HTTPS Port 27124)
   |
   | Local REST API (Port 27124, SSL self-signed, Bearer token)
   v
[TANG 3: MCP PROTOCOL & AI AGENTS]
NPM: mcp-obsidian-extended
   |-- Antigravity IDE (mcp_config.json)
   |-- Cursor (.cursor/mcp.json)
   |-- Windsurf (~/.codeium/windsurf/mcp_config.json)
   |-- VS Code Cline / Roo-Code (cline_mcp_settings.json)
   `-- Claude Desktop (claude_desktop_config.json)
```

---

## 3. Quy Trinh Cai Dat & Cau Hinh 5 Buoc (Zero-UI Playbook)

Cac lenh duoc thiet ke tong quat hoa (parameterized). Agent chi can set bien `$WORKSPACE_ROOT` la co the chay lien mach:

### Buoc 1: Cai Dat Ung Dung Obsidian

#### Tren Windows:
```powershell
# Uu tien 1: Cai dat tu dong qua winget (chuyen source winget tranh loi store)
winget install -s winget -e --id Obsidian.Obsidian --accept-package-agreements --accept-source-agreements

# Uu tien 2 (Fallback): Tai file exe truc tiep tu GitHub Release
# URL: https://github.com/obsidianmd/obsidian-releases/releases/download/v1.14.4/Obsidian-1.14.4.exe
```

#### Tren macOS:
```bash
brew install --cask obsidian
```

### Buoc 2: Khoi Tao Global Vault & Lien Ket Repositories

Thiet lap bien moi truong cho thu muc lam viec cua ban:

#### Tren Windows (PowerShell):
```powershell
# 1. Dat duong dan workspace (thay doi phu hop voi may cua ban):
$WORKSPACE_ROOT = "D:\workspaces"  # Hoac "$env:USERPROFILE\Desktop\workspaces", v.v.
$VAULT_PATH = "$WORKSPACE_ROOT\global-vault"

# 2. Tao thu muc Global Vault:
New-Item -ItemType Directory -Path $VAULT_PATH -Force

# 3. Tao Directory Junction noi thu muc .agent-wiki cua repo vao Vault:
# Cu phap: cmd /c mklink /J "$VAULT_PATH\<TEN_REPO>" "<DUONG_DAN_REPO>\.agent-wiki"
cmd /c mklink /J "$VAULT_PATH\paymenthub-checkout-web" "$WORKSPACE_ROOT\paymenthub-checkout-web\.agent-wiki"
```

#### Tren macOS / Linux (Bash):
```bash
WORKSPACE_ROOT="$HOME/workspaces"
VAULT_PATH="$WORKSPACE_ROOT/global-vault"

mkdir -p "$VAULT_PATH"
ln -s "$WORKSPACE_ROOT/paymenthub-checkout-web/.agent-wiki" "$VAULT_PATH/paymenthub-checkout-web"
```

> [!NOTE]
> Tren Windows, dung `mklink /J` (Directory Junction) thay vi symbolic link vi Junction khong yeu cau quyen Administrator va tuong thich 100% voi he thong file NTFS.

### Buoc 3: Cau Hinh Tu Dong Mo Vault & Giao Dien Toi Uu

#### 1. Khai bao Vault trong he dieu hanh de Obsidian tu mo khi khoi dong
Vi tri file:
- Windows: `%APPDATA%\obsidian\obsidian.json`
- macOS: `~/Library/Application Support/obsidian/obsidian.json`
- Linux: `~/.config/obsidian/obsidian.json`

Noi dung file (thay the `<DUONG_DAN_TUYET_DOI_DEN_GLOBAL_VAULT>` bang duong dan thuc te tren may, luu y dau double backslash `\\` tren Windows):
```json
{
  "vaults": {
    "global-vault-id": {
      "path": "<DUONG_DAN_TUYET_DOI_DEN_GLOBAL_VAULT>",
      "open": true,
      "ts": 1791272687508
    }
  }
}
```
*Vi du tren Windows:* `"path": "D:\\workspaces\\global-vault"`

#### 2. Cau hinh hien thi trong Vault
Tao file: `<VAULT_PATH>\.obsidian\app.json`
```json
{
  "legacyEditor": false,
  "livePreview": true,
  "showLineNumber": true,
  "useMarkdownLinks": false,
  "attachmentFolderPath": "/"
}
```

#### 3. Kich hoat cac Core Plugins can thiet (Graph, Backlinks, Canvas)
Tao file: `<VAULT_PATH>\.obsidian\core-plugins.json`
```json
[
  "file-explorer",
  "global-search",
  "switcher",
  "graph",
  "backlink",
  "canvas",
  "outgoing-link",
  "tag-pane",
  "page-preview",
  "command-palette",
  "markdown-importer",
  "word-count",
  "outline"
]
```

### Buoc 4: Cai Dat & Khoi Chay Plugin `Local REST API`

Plugin Local REST API (tac gia Adam Coddington) la cau noi de MCP Server truy van vao Obsidian thong qua HTTPS tai cong `27124`.

#### 1. Tao thu muc plugin
```powershell
$PLUGIN_DIR = "$VAULT_PATH\.obsidian\plugins\obsidian-local-rest-api"
New-Item -ItemType Directory -Path $PLUGIN_DIR -Force
```

#### 2. Tai 2 file plugin release v5.4.0
- Tren Windows (PowerShell):
```powershell
Invoke-WebRequest -Uri "https://github.com/coddingtonbear/obsidian-local-rest-api/releases/download/5.4.0/main.js" -OutFile "$PLUGIN_DIR\main.js"
Invoke-WebRequest -Uri "https://github.com/coddingtonbear/obsidian-local-rest-api/releases/download/5.4.0/manifest.json" -OutFile "$PLUGIN_DIR\manifest.json"
```
- Tren macOS / Linux (cURL):
```bash
curl -L -o "$PLUGIN_DIR/main.js" "https://github.com/coddingtonbear/obsidian-local-rest-api/releases/download/5.4.0/main.js"
curl -L -o "$PLUGIN_DIR/manifest.json" "https://github.com/coddingtonbear/obsidian-local-rest-api/releases/download/5.4.0/manifest.json"
```

#### 3. Kich hoat Community Plugin
Tao file: `<VAULT_PATH>\.obsidian\community-plugins.json`
```json
[
  "obsidian-local-rest-api"
]
```

#### 4. Cau hinh san Port va API Key trong `data.json`
Tao file: `<VAULT_PATH>\.obsidian\plugins\obsidian-local-rest-api\data.json`
```json
{
  "port": 27124,
  "insecurePort": 27123,
  "enableInsecureServer": false,
  "enableSignedUrls": true,
  "apiKey": "5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8"
}
```
*(Ghi chu: Khi Obsidian khoi dong lan dau voi file nay, plugin se tu dong sinh chung chi SSL cuc bo `crypto` trong `data.json` ma khong lam thay doi `apiKey` va `port`).*

---

## 4. Cau Hinh MCP Server Cho Cac IDE & AI Agent

Goi MCP Server duoc chuan hoa cho toan bo he thong la: **`mcp-obsidian-extended`** (Chay qua Node / npx).

### 1. Antigravity IDE
File:
- Windows: `%USERPROFILE%\.gemini\config\mcp_config.json`
- macOS / Linux: `~/.gemini/config/mcp_config.json`

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-obsidian-extended"
      ],
      "env": {
        "OBSIDIAN_API_KEY": "5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8",
        "OBSIDIAN_PORT": "27124",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

### 2. Cursor IDE
File: `<WORKSPACE_ROOT>/.cursor/mcp.json` hoac trong `Cursor Settings -> Features -> MCP`:
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian-extended"],
      "env": {
        "OBSIDIAN_API_KEY": "5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8",
        "OBSIDIAN_PORT": "27124",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

### 3. Windsurf IDE
File:
- Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
- macOS / Linux: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian-extended"],
      "env": {
        "OBSIDIAN_API_KEY": "5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8",
        "OBSIDIAN_PORT": "27124",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

### 4. VS Code + Cline / Roo-Code
File:
- Cline: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Roo-Code: `%APPDATA%\Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian-extended"],
      "env": {
        "OBSIDIAN_API_KEY": "5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8",
        "OBSIDIAN_PORT": "27124",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

### 5. Claude Desktop
File:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian-extended"],
      "env": {
        "OBSIDIAN_API_KEY": "5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8",
        "OBSIDIAN_PORT": "27124",
        "NODE_TLS_REJECT_UNAUTHORIZED": "0"
      }
    }
  }
}
```

### 6. Claude Code CLI
Chay lenh truc tiep tren terminal:
```bash
claude mcp add obsidian -- npx -y mcp-obsidian-extended
```
Sau do khai bao cac bien moi truong trong terminal profile (`.bashrc`, `.zshrc` hoac PowerShell `$PROFILE`):
```bash
export OBSIDIAN_API_KEY="5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8"
export OBSIDIAN_PORT="27124"
export NODE_TLS_REJECT_UNAUTHORIZED="0"
```

> [!IMPORTANT]
> **Tham so song con:** Bien `"NODE_TLS_REJECT_UNAUTHORIZED": "0"` la bat buoc tren moi IDE. Neu thieu bien nay, Node.js se chan ket noi toi port `27124` vi chung chi SSL cua Local REST API la chung chi tu ky (self-signed localhost).

---

## 5. Kiem Tra Ket Noi & Trinh Trang He Thong (Healthcheck)

Kiem tra xem Obsidian Local REST API da san sang tiep nhan truy van hay chua:

### Cach 1: Kiem tra bang Node.js mot dong (Khuyen dung tren moi he dieu hanh)
```bash
node -e "const https = require('https'); https.get({hostname: '127.0.0.1', port: 27124, path: '/', method: 'GET', rejectUnauthorized: false, headers: {'Authorization': 'Bearer 5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8'}}, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => console.log('RESULT:', d)); }).on('error', e => console.error('ERROR:', e.message));"
```
**Ket qua tra ve thanh cong:**
```json
RESULT: {"status":"OK","manifest":{"manifestVersion":"1","pluginVersion":"5.4.0"}}
```

### Cach 2: Kiem tra bang cURL
```bash
curl -k -H "Authorization: Bearer 5e7efa721d683c786cdd331ea904e743742fa40464b77ebc402ff2f75f4c6ca8" https://127.0.0.1:27124/
```

---

## 6. Huong Dan Su Dung Cho Developer (Human Workflow)

1. **Mo ung dung Obsidian**:
   - Khoi chay Obsidian tu menu ung dung. Obsidian se tu dong mo truc tiep vao `global-vault`.
2. **Mo Master Map of Content (MOC)**:
   - Nhan to hop phim `Ctrl + O` (tren Mac la `Cmd + O`) -> Go `MOC` -> Nhan `Enter`.
   - Toan bo he thong kien truc 6 domains, ticket xu ly va quy tac bat bien hien ra truc quan.
3. **Xem Bieu Do Do Thi (Graph View)**:
   - Nhan `Ctrl + G` (Mac: `Cmd + G`) de mo Graph View.
   - Quan sat cac cum lien ket tri thuc giua cac domain (`bill-split-and-mix`, `payment-methods`, `architecture`, v.v.).
4. **Xem Lien Ket Hai Chieu (Backlinks)**:
   - Mo bat ky note nao (vi du `cancel-and-expire.md`), nhin sang thanh ben phai (Backlinks pane) de thay toan bo nhung tai lieu khac dang dan chieu den note nay.
5. **Chinh sua truc tiep & Dong bo Git**:
   - Nho co co che Windows Directory Junction / Unix Symlink, bat ky thao tac sua file, them note nao tren Obsidian se lap tuc ghi thang vao thu muc `<repo>/.agent-wiki/`. Developer chi can thao tac `git status`, `git add`, `git commit` ben trong repository nhu binh thuong.

---

## 7. Huong Dan Su Dung Cho AI Agent (Agent Tool Calling Patterns)

Khi AI Agent tiep nhan ticket hoac can tra cuu kien truc, **tuyet doi khong scan file o dia bang grep_search ma hay goi truc tiep cac MCP Tools sau**:

### 1. Tim kiem toan van (Semantic / Keyword / Ticket Search)
Khi nguoi dung hoi ve mot ticket hoac khai niem nghiep vu (vi du: `FVAC-2560`, `PH-2468`, `actualRemain`, `split-mix`):
```json
call_mcp_tool({
  "ServerName": "obsidian",
  "ToolName": "simple_search",
  "Arguments": {
    "query": "FVAC-2560"
  }
})
```
*Loi ich: Tra ve ngay lap tuc danh sach file phu hop kem snippet lien quan ma khong can doc toan bo file, tiet kiem quota token.*

### 2. Doc noi dung chi tiet cua Note
Sau khi da co duong dan note tu ket qua tim kiem:
```json
call_mcp_tool({
  "ServerName": "obsidian",
  "ToolName": "get_file_contents",
  "Arguments": {
    "file_path": "paymenthub-checkout-web/domains/voucher-and-promotions/business-rules.md"
  }
})
```

### 3. Mo tai lieu truc tiep tren man hinh cua Developer
Khi Agent muon huong su chu y cua Developer toi mot tai lieu quan trong tren Obsidian GUI:
```json
call_mcp_tool({
  "ServerName": "obsidian",
  "ToolName": "open_file",
  "Arguments": {
    "file_path": "paymenthub-checkout-web/domains/payment-methods/soft-dynamic.md"
  }
})
```

### 4. Truy van do thi lien ket (Graph Backlinks & Connections)
De kiem tra xem mot quy tac nghiep vu hoac API co anh huong den nhung man hinh hay luong thanh toan nao khac:
```json
call_mcp_tool({
  "ServerName": "obsidian",
  "ToolName": "get_note_connections",
  "Arguments": {
    "file_path": "paymenthub-checkout-web/domains/bill-split-and-mix/payment-method-mix.md"
  }
})
```

---

## 8. Xu Ly Su Co Thuong Gap (Troubleshooting FAQ)

### Loi 1: `fetch failed: DEPTH_ZERO_SELF_SIGNED_CERT`
- **Nguyen nhan:** Local REST API su dung chung chi SSL tu ky (self-signed) tren localhost `https://127.0.0.1:27124`.
- **Khac phuc:** Bat buoc phai co bien moi truong `"NODE_TLS_REJECT_UNAUTHORIZED": "0"` trong phan `env` cua cau hinh MCP Server o moi IDE.

### Loi 2: `Connection refused: 127.0.0.1:27124`
- **Nguyen nhan:** Obsidian chua duoc bat, hoac plugin `Local REST API` chua duoc load.
- **Khac phuc:**
  1. Mo ung dung Obsidian len.
  2. Vao `Settings` -> `Community plugins` -> kiem tra `Local REST API` da duoc bat (Toggle ON).
  3. Neu port bi chiem boi ung dung khac, vao plugin settings doi sang port khac (vi du `27125`) va cap nhat lai file MCP config.

### Loi 3: `npm error 404: mcp-server-obsidian is not in this registry`
- **Nguyen nhan:** Package ten `mcp-server-obsidian` khong ton tai tren npm registry.
- **Khac phuc:** Dung dung package chuan hoa da duoc kiem thu: `mcp-obsidian-extended`.

### Loi 4: Khong the tao Windows Junction (`mklink /J`)
- **Nguyen nhan:** Thu muc dich da ton tai hoac duong dan co khoang trang ma khong duoc boc trong dau ngoac kep `""`.
- **Khac phuc:**
  - Xoa thu muc dich truoc khi chay `mklink /J`.
  - Luon boc ca 2 duong dan trong dau ngoac kep `"..."`.
  - Chay bang `cmd.exe` hoac `cmd /c mklink /J ...` thay vi PowerShell goc.

---

## 9. Huong Dan Mo Rong Cho Repository Moi (Onboarding New Repos)

Khi mot repo khac (vi du: `rsa-web`, `debit-web`) hoan thanh xong thu muc tri thuc `.agent-wiki`:
1. Chay lenh tao Junction them vao `global-vault`:
   - Tren Windows:
     ```cmd
     cmd /c mklink /J "<WORKSPACE_ROOT>\global-vault\<TEN_REPO_MOI>" "<DUONG_DAN_REPO_MOI>\.agent-wiki"
     ```
   - Tren macOS / Linux:
     ```bash
     ln -s "<DUONG_DAN_REPO_MOI>/.agent-wiki" "<WORKSPACE_ROOT>/global-vault/<TEN_REPO_MOI>"
     ```
2. Cap nhat Master MOC tai `<WORKSPACE_ROOT>\global-vault\README.md` de lien ket den `[[<TEN_REPO_MOI>/MOC]]`.
3. Toan bo AI Agents tai moi IDE lap tuc co the dung tool `simple_search` va do thi Obsidian Graph lap tuc ket noi du an moi ma khong can cai them bat ky tool hay port nao khac.
