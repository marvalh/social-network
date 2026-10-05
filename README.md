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

## Project Structure

```text
social-network/
├── backend/
│   ├── pkg/
│   │   ├── auth/           # sessions, cookies, bcrypt
│   │   ├── follow/         # follow requests, followers/following
│   │   ├── profile/        # profile read/update, avatar
│   │   ├── posts/          # posts, comments, likes
│   │   ├── groups/         # groups, invites, join requests, events
│   │   ├── chat/           # private + group messaging
│   │   ├── notifications/  # notification feed
│   │   ├── ws/             # WebSocket hub
│   │   └── db/
│   │       ├── migrations/sqlite/
│   │       └── queries/
│   ├── server.go
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/            # routes/pages
│   │   ├── components/
│   │   ├── services/       # API clients
│   │   ├── types/
│   │   └── hooks/
│   └── Dockerfile
└── docker-compose.yml
```

## Getting Started

### Backend
```bash
cd backend
go mod download
 # running seed/main.go is optional, but recommended since it shows the full project functionality
go run ./cmd/seed
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