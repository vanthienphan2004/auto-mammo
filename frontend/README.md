# AutoMammo — Frontend

React single-page application providing radiologists with a dashboard to upload mammograms, review AI-generated reports, and manage a priority-sorted case queue.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 7 |
| **Routing** | TanStack Router (file-based) |
| **Data Fetching** | TanStack Query |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui + Radix UI |
| **Icons** | Lucide React, Tabler Icons |
| **Auth** | Clerk |
| **HTTP Client** | Axios |
| **Package Manager** | pnpm |

## Project Structure

```
frontend/
├── index.html                        # HTML entry point
├── vite.config.ts                    # Vite config (React, Tailwind, TanStack Router)
├── package.json
├── tsconfig.json
├── .env.example                      # Environment variable template
├── public/                           # Static assets
└── src/
    ├── main.tsx                      # App bootstrap (Clerk, QueryClient, QueueProvider)
    ├── app.tsx                       # Router setup
    ├── index.css                     # Global styles & Tailwind directives
    ├── routeTree.gen.ts              # Auto-generated route tree
    ├── components/
    │   ├── dashboard/
    │   │   ├── mammography-queue.tsx  # Priority-sorted case queue table
    │   │   ├── review-case-modal.tsx  # Case review dialog with report & image
    │   │   ├── stat-card.tsx         # Individual statistic card
    │   │   └── stat-rows.tsx         # Dashboard summary statistics
    │   ├── layout/                   # App layout wrapper
    │   ├── shared/                   # Shared/reusable components
    │   ├── ui/                       # shadcn/ui primitives (button, dialog, etc.)
    │   └── upload/                   # Mammogram upload component
    ├── pages/
    │   ├── home.tsx                  # Dashboard page (stats + queue)
    │   └── archive.tsx              # Patient scan archive gallery
    ├── routes/
    │   ├── __root.tsx               # Root layout route
    │   ├── index.tsx                # Home route (/)
    │   ├── archive.tsx             # Archive route (/archive)
    │   └── (auth)/                  # Auth-protected routes
    ├── services/
    │   ├── axios.config.ts          # Axios instance configuration
    │   └── api/
    │       ├── base-entity.api.ts   # Base API helper
    │       └── report.ts            # Report generation API calls
    ├── hooks/
    │   ├── use-queue.tsx            # Queue state management (context + hook)
    │   └── use-mobile.ts           # Mobile viewport detection hook
    ├── types/
    │   ├── queue.ts                 # QueueItem type definitions
    │   └── report.ts               # Report type definitions
    └── data/
        ├── mock-queue.ts            # Mock queue data for development
        ├── queue-config.ts          # Queue urgency & status configuration
        └── app-sidebar-data.ts      # Sidebar navigation items
```

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- A running [backend server](../backend/README.md)
- [Clerk](https://clerk.com/) account for authentication

### Installation

```bash
cd frontend
pnpm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for authentication |
| `VITE_API_URL` | Backend API base URL, e.g. `http://localhost:5001` |

### Development Server

```bash
pnpm dev
```

The app starts at **`http://localhost:5173`** with hot module replacement.

### Other Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint |

## Pages

### Dashboard (`/`)

The main radiologist workspace featuring:

- **Summary Statistics** — at-a-glance counts of queue status (pending, in-review, completed).
- **Mammography Queue** — a priority-sorted table of patient cases. Cases with higher urgency scores appear first. Each row shows patient ID, age, sex, status, urgency level, and time in queue.
- **Case Review Modal** — click a case to open a detailed view showing the mammogram image, AI-generated report, and clinical metadata.
- **Upload** — upload new mammogram images for AI analysis directly from the dashboard.

### Patient Archive (`/archive`)

A visual gallery of all uploaded mammography scans, displayed as an image grid with patient metadata overlays. Supports browsing historical cases.

## Authentication

The app uses [Clerk](https://clerk.com/) for user authentication. The `ClerkProvider` wraps the entire application in `main.tsx`, protecting routes under the `(auth)` directory. Users must sign in before accessing the dashboard.

## Connecting to the Backend

API requests are routed through an Axios instance configured in `services/axios.config.ts`. The base URL is set via the `VITE_API_URL` environment variable, with all API calls prefixed with `/api/`. The primary endpoint used is:

- `POST /api/report` — sends a mammogram image and receives a structured report with an urgency score.
