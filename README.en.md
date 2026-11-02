# ScorchAgents

A Skill-based full-stack AI Agent project development toolchain.

## Core Workflow

From zero to a complete web application in 6 steps:

```
/sainit-*  ──►  /safrontend  ──►  /saapi (incl. Admin API)  ──►  /sabackend  ──►  /saadmin  ──►  /saapi-connect
  Prototype        Web Frontend         API Design                Backend        Admin Panel      Frontend & Backend Connected
```

| Step | Skill | Function | Output |
|------|-------|----------|--------|
| 1 | `/sainit-*` | Generate an interactive HTML prototype; define UI style, feature list, page structure | `prototype/` + `STEPS.md` |
| 2 | `/safrontend` | Convert the prototype into a Vue 3 / React 18 frontend project with routing, state management, and API scaffolding | `frontend/` |
| 3 | `/saapi` | Scan frontend code + reverse-engineer APIs from the prototype, **including Admin APIs**, and generate an OpenAPI 3.0 spec | `api/openapi.yaml` + `api/API.md` |
| 4 | `/sabackend` | Implement the backend service per the OpenAPI spec, including database schema, business logic, and Admin endpoints | `backend/` + `sql/init.sql` |
| 5 | `/saadmin` | Generate a React 18 + TypeScript + Ant Design admin panel directly from the Admin API | `admin/` |
| 6 | `/saapi-connect` | Replace mock auth, **connect the main frontend + admin panel**, inject JWT, global error handling, Vite proxy + CORS | Modifies `frontend/`, `admin/`, `backend/` |

> Completing the core workflow = a complete web application (frontend + admin + backend + database), ready to deploy.

### Initialization Types

`/sainit` automatically routes to the matching sub-skill based on the project description:

| Keywords | Type | Sub-skill |
|----------|------|-----------|
| Dating / Social / Chat / Matching | dating | `/sainit-dating` |
| Shop / E-commerce / Shopping / Orders | shop | `/sainit-shop` |
| Blog / Article / News / Notes | blog | `/sainit-blog` |
| To-do / Bookkeeping / Tool / Productivity | tool | `/sainit-tool` |
| SaaS / API Platform / Developer Platform | saas | `/sainit-saas` |
| Unmatched / Cross-type | other | `/sainit-other` |

### Design Iteration (optional, between Step 1 and Step 2)

After the prototype is generated, use the following design skills to refine the visual style. They can be **chained in a loop**:

- `frontend-design` — High-fidelity UI redesign
- `color-font-skill` — Color palette + typography tuning
- `ui-ux-pro-max` — UI/UX design intelligence
- `frontend-dev` — Full-stack frontend (with motion + media)
- `design-style-skill` — Unified PPT / visual style

## Extended Workflows

### API Platform Extension

```
/saapi-platform  ──►  /sainference
 Platform-level API      AI model inference integration
```

- `/saapi-platform` — API Key management, SSE streaming, pay-as-you-go billing, OpenAI-compatible endpoints
- `/sainference` — Integrate AI providers such as Alibaba Cloud Bailian / SiliconFlow / DeepSeek / OpenAI

### Cross-Platform Delivery

```
/sacrossplatform  ──►  /sadeploy-mobile
  iOS + Android          Build .apk / .ipa

/sadesktop  ──►  /sadeploy-desktop
  Win + Mac + Linux      Build .exe / .dmg / .deb
```

- `/sacrossplatform` — Convert a web frontend into a React Native / Expo / uni-app / Taro mobile app
- `/sadeploy-mobile` — Mobile app packaging and build scripts
- `/sadesktop` — Convert a web frontend into an Electron / Tauri desktop app
- `/sadeploy-desktop` — Desktop app packaging and build scripts

### Deployment

```
After /saapi-connect completes
       │
       ├──► /sacrossplatform  ──►  /sadeploy-mobile
       ├──► /sadesktop  ──►  /sadeploy-desktop
       └──► /sadeploy (direct web project deployment)
```

- `/sadeploy` — One-click full-stack deployment: supports Ubuntu / Debian / CentOS / macOS / Windows, native deployment + Docker containers, Baota / 1Panel panel integration, Nginx + automatic SSL configuration

## Full Architecture Overview

```
                    ┌─ frontend-design ──────┐
                    ├─ color-font-skill ─────┤
/sainit-* ──Step 7─►├─ ui-ux-pro-max ────────┼──► /safrontend ──► /saapi (incl. Admin API) ──► /sabackend
  Prototype         ├─ frontend-dev ─────────┤     Web Frontend          API Design                Backend
                    ├─ design-style-skill ───┘
                    └─ F. Skip to safrontend ┘
                                                                              │
                                                                              ▼
                                                                         /saadmin
                                                                   React 18 + Ant Design
                                                                       Admin Panel
                                                                              │
                                                                              ▼
                                                                       /saapi-connect
                                                                 Connect main frontend + admin
                                                                              │
                                                 ┌────────────────────────────┼────────────────────────────┐
                                                 ▼                            ▼                            ▼
                                          /sacrossplatform               /sadesktop                   /sadeploy
                                          iOS + Android                Win + Mac + Linux            Full-stack Web
                                                 │                            │
                                                 ▼                            ▼
                                          /sadeploy-mobile             /sadeploy-desktop
                                           Build .apk/.ipa              Build .exe/.dmg/.deb
```

## Full Skill List

| Category | Skill | Function |
|----------|-------|----------|
| Initialization | `sainit` / `sainit-dating` / `sainit-shop` / `sainit-blog` / `sainit-tool` / `sainit-saas` / `sainit-other` | Project prototype generation |
| Frontend | `safrontend` | Vue 3 / React 18 frontend development |
| API | `saapi` | API design (incl. Admin API) |
| Backend | `sabackend` | Backend service implementation |
| Admin | `saadmin` | React 18 + Ant Design admin panel |
| Connect | `saapi-connect` | Frontend-backend integration (main frontend + admin) |
| Deploy | `sadeploy` | Full-stack web deployment |
| Platform | `saapi-platform` | API platform-level design |
| AI | `sainference` | AI model inference integration |
| Cross-platform | `sacrossplatform` | Mobile app development |
| Desktop | `sadesktop` | Desktop app development |
| Bridge | `sanative-bridge` | Native capability wrapper |
| Packaging | `sadeploy-mobile` | Mobile app packaging |
| Packaging | `sadeploy-desktop` | Desktop app packaging |

## Project Directory Structure

```
<project-name>/
├── README.md
├── STEPS.md                 # Step tracking (shared by all skills)
├── prototype/               # Prototype design (output of /sainit-*)
├── frontend/                # Frontend code (output of /safrontend)
├── admin/                   # Admin panel (output of /saadmin)
├── api/                     # API specification (output of /saapi)
│   ├── openapi.yaml
│   └── API.md
├── backend/                 # Backend service (output of /sabackend)
│   ├── sql/
│   │   └── init.sql
│   └── src/
├── deploy/                  # Deployment scripts (output of /sadeploy)
│   ├── ubuntu/
│   │   ├── deploy.sh
│   │   ├── update.sh
│   │   ├── rollback.sh
│   │   ├── nginx.conf
│   │   └── docker-compose.yml
│   └── README.md
├── mobile/                  # Mobile app (output of /sacrossplatform, optional)
├── desktop/                 # Desktop app (output of /sadesktop, optional)
└── inference/               # AI inference integration (output of /sainference, optional)
```

## Installation and Usage

1. Clone this repository
2. Type `/sainit <project description>` in the chat to get started
3. Follow the core workflow above step by step:
   - `/sainit-*` → `/safrontend` → `/saapi` → `/sabackend` → `/saadmin` → `/saapi-connect`
4. After the core workflow is complete, choose a deployment path:
   - Web project → `/sadeploy`
   - Mobile → `/sacrossplatform` → `/sadeploy-mobile`
   - Desktop → `/sadesktop` → `/sadeploy-desktop`

## Contributing

1. Fork this repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request
