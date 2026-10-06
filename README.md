# Social Network

A Facebook-style social network built with a **Go** REST API + **SQLite** backend and a **Next.js/React/TypeScript** frontend, using session-based auth and WebSockets for real-time chat and notifications.

## Features

- **Auth** — register/login/logout, bcrypt-hashed passwords, cookie sessions, protected routes
- **Profiles** — public/private visibility, avatar upload, editable bio/details
- **Follow system** — follow requests with accept/decline/cancel, auto-follow on public profiles, followers/following lists
- **Posts** — create/edit/delete, image or GIF attachments, three privacy levels (public, followers-only, selected followers), likes and comments
- **Groups** — create/browse, invite or request to join, group posts & comments, events with Going/Not Going responses
- **Chat** — real-time private messages and group chat rooms over WebSockets, emoji support
- **Notifications** — live, in-app notifications for follow requests, group invites, join requests, and new events

## Tech Stack

| Layer    | Stack |
|----------|-------|
| Backend  | Go (`net/http`), SQLite, `golang-migrate`, `gorilla/websocket`, `bcrypt`, UUID |
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Infra    | Docker (separate backend/frontend images), SQL migrations |

## Getting Started

### Backend
```bash
cd backend
go mod download
 # running seed/main.go is optional, but recommended since it shows the full project functionality
go run ./cmd/seed # check out the file to log-in with appropriate credentials
go run .        # runs migrations automatically, serves on :8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # serves on :3000
```

### Docker
```bash
docker compose up --build
```

## Project Structure
 
```text
social-network/
├── backend/
│   ├── cmd/
│   │   └── seed/
│   ├── data/
│   ├── pkg/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── db/
│   │   │   ├── migrations/sqlite/
│   │   │   ├── queries/
│   │   │   └── sqlite/
│   │   ├── errors/
│   │   ├── follow/
│   │   ├── groups/
│   │   ├── helpers/
│   │   ├── images/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── notifications/
│   │   ├── posts/
│   │   ├── profile/
│   │   ├── router/
│   │   └── ws/
│   ├── server.go
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   └── (main)/
│   │   │       ├── follow/
│   │   │       ├── groups/
│   │   │       │   ├── invites/
│   │   │       │   ├── new/
│   │   │       │   └── [id]/
│   │   │       │       ├── chat/
│   │   │       │       └── events/
│   │   │       ├── home/
│   │   │       ├── messages/
│   │   │       │   └── [userId]/
│   │   │       ├── notifications/
│   │   │       ├── people/
│   │   │       ├── posts/
│   │   │       │   └── [id]/
│   │   │       └── profile/
│   │   │           └── [id]/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── feed/
│   │   │   ├── follow/
│   │   │   ├── form/
│   │   │   ├── groups/
│   │   │   ├── layout/
│   │   │   ├── notifications/
│   │   │   └── profile/
│   │   ├── context/
│   │   ├── css/
│   │   ├── docs/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── Dockerfile
└── docker-compose.yml
```
 
### Backend folders
 
| Folder | Purpose |
|--------|---------|
| `cmd/seed` | Standalone script (`go run ./cmd/seed`) that populates the database with dummy users, posts, groups, and messages so the app has real data to click through |
| `data` | Where the SQLite `.db` file is created and lives at runtime |
| `pkg/auth` | Login/register logic, session cookies, password hashing |
| `pkg/chat` | Private messages and group chat — HTTP handlers and request/response logic |
| `pkg/db/migrations/sqlite` | Versioned `.up.sql`/`.down.sql` files that create and evolve the database schema |
| `pkg/db/queries` | All raw SQL — every `SELECT`/`INSERT`/`UPDATE`/`DELETE` the app runs, grouped by feature (`user.go`, `follow.go`, `posts.go`, `group.go`, etc.) |
| `pkg/db/sqlite` | Opens the database connection and runs pending migrations on startup |
| `pkg/errors` | Shared HTTP error helpers (404, 401, 409, 500, etc.) so every handler responds consistently |
| `pkg/follow` | Follow/unfollow, follow requests, followers and following lists |
| `pkg/groups` | Groups, invites, join requests, membership, and events |
| `pkg/helpers` | Small shared utilities (e.g. sending JSON responses) |
| `pkg/images` | Avatar and post image upload/validation handling |
| `pkg/middleware` | Request middleware — auth checks, logging, etc. run before handlers |
| `pkg/models` | Go structs representing database rows and API request/response shapes |
| `pkg/notifications` | Creating and listing in-app notifications |
| `pkg/posts` | Posts, comments, likes, and the home feed |
| `pkg/profile` | Reading and updating a user's profile, including visibility (public/private) |
| `pkg/router` | Wires every URL path to its handler — the single source of truth for the API surface |
| `pkg/ws` | The WebSocket hub — tracks connected users and pushes real-time events to them |
 
### Frontend folders
 
| Folder | Purpose |
|--------|---------|
| `public` | Static assets served as-is (favicon, images, etc.) |
| `src/app/(auth)` | Login and register pages — a route group kept separate from the logged-in app shell |
| `src/app/(auth)/login` | The login page |
| `src/app/(auth)/register` | The registration page |
| `src/app/(main)` | Every page behind authentication, sharing the main app layout (sidebar/topbar) |
| `src/app/(main)/follow` | Follow-requests page |
| `src/app/(main)/groups` | Browse/your groups page, plus nested routes for invites, creating a group, and a single group's detail/chat/events |
| `src/app/(main)/home` | The main feed |
| `src/app/(main)/messages` | Conversations list, plus `[userId]` for an individual direct-message thread |
| `src/app/(main)/notifications` | Notifications page |
| `src/app/(main)/people` | Suggested users / people you may know |
| `src/app/(main)/posts` | `[id]` — a single post's detail page (e.g. opened from a notification) |
| `src/app/(main)/profile` | `[id]` — a user's profile page |
| `src/components/auth` | Login/register form components |
| `src/components/chat` | Conversation list, chat window, message composer |
| `src/components/feed` | Post card, comment list, post composer |
| `src/components/follow` | Follow button, follow requests list, people list |
| `src/components/form` | Shared, generic form building blocks |
| `src/components/groups` | Group cards, member list, invite UI, event RSVP UI |
| `src/components/layout` | App-wide chrome — topbar, sidebar, modals, spinners |
| `src/components/notifications` | Notification bell and notification list items |
| `src/components/profile` | Profile header, avatar, bio/edit UI |
| `src/context` | React context providers (auth state, unread counts, etc.) shared across the app |
| `src/css` | Global stylesheet and design tokens |
| `src/docs` | Project notes/documentation kept alongside the code |
| `src/hooks` | Shared custom hooks (`useRequireAuth`, `useLive`, etc.) |
| `src/services` | One file per API area — thin wrappers around `fetch` that call the backend |
| `src/types` | Shared TypeScript types matching the backend's JSON responses |
| `src/utils` | Small shared helper functions (validation, formatting, etc.) |

## API Overview

Full route list lives in `backend/pkg/router/router.go`. Key groups:

| Area          | Base path                          |
|---------------|-------------------------------------|
| Auth          | `/api/register`, `/api/login`, `/api/logout` |
| Profile       | `/api/profile/{id}`, `/api/profile/me/*` |
| Follow        | `/api/users/{id}/follow*`, `/api/follow-requests/*` |
| Posts         | `/api/posts/*`, `/api/feed`, `/api/users/{id}/posts` |
| Groups        | `/api/groups/*`, `/api/invites/*`, `/api/events/*` |
| Chat          | `/api/chat/{userId}`, `/api/chat/group/{groupId}`, `/ws` |
| Notifications | `/api/notifications/*` |

## License

Educational project 