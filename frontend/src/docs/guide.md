# split

(same as backend)

signup / login + follow system page - marwa
posts + comments feed (home page) - zainab
user profile - fatema
chats and notifs - ahmed
groupchats and events - jaber

# framework

next.js (including react components)
we will use shadcn's reusable react components
link -> https://ui.shadcn.com/create?preset=b27GcrRo (check resources.md)

# how to run
in two diff terminals : 
cd backend and `go run .`
cd frontend and type `npm run dev` 

# rough frontend structure
(doesnt have to be exactly the same)

frontend/
|
│  
│       
│
├── public/
│   └── escape.png
│
└── src/
    ├── app/
    │   ├── layout.tsx                       # root: fonts, AuthProvider
    │   ├── page.tsx                          # "/" — redirects to /login or shows home
    │   │
    │   ├── (auth)/
    │   │   ├── layout.tsx                    # AuthShell + guest guard, parent folder is (auth) to indicate children files
    │   │   ├── login/                          are in same routing grp, (auth) file path wont appear in url.
    │   │   │   └── page.tsx
    │   │   └── register/
    │   │       └── page.tsx
    │   │
    │   └── (main)/
    │       ├── layout.tsx                    # sidebar/topbar shell + auth guard
    │       ├── home/
    │       │   └── page.tsx                  # feed
    │       ├── profile/
    │       │   └── [id]/
    │       │       └── page.tsx              # own or another user's profile
    │       ├── groups/
    │       │   ├── page.tsx                  # browse/search all groups
    │       │   └── [id]/
    │       │       ├── page.tsx              # group posts + members
    │       │       └── events/
    │       │           └── page.tsx
    │       ├── messages/
    │       │   ├── page.tsx                  # conversation list
    │       │   └── [userId]/
    │       │       └── page.tsx              # one DM thread
    │       └── notifications/
    │           └── page.tsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── AuthShell.tsx                 # split-panel shell for login/register
    │   │   ├── FullPageSpinner.tsx
    │   │   ├── Sidebar.tsx                   # main-app nav
    │   │   ├── Topbar.tsx                    # notif bell, search, avatar menu
    │   │   └── NotificationBell.tsx          # badge + dropdown, lives in every page
    │   │
    │   ├── auth/
    │   │   ├── LoginForm.tsx
    │   │   ├── RegisterForm.tsx
    │   │   └── AuthFormParts.tsx             # AuthHeading / FormError / FormNotice / CharCount
    │   │
    │   ├── feed/
    │   │   ├── PostComposer.tsx
    │   │   ├── PostCard.tsx
    │   │   ├── CommentList.tsx
    │   │   ├── CommentComposer.tsx
    │   │   └── PrivacySelect.tsx             # public / almost-private / private
    │   │
    │   ├── profile/
    │   │   ├── ProfileHeader.tsx             # info, avatar, public/private toggle
    │   │   ├── FollowButton.tsx              # follow / requested / following states
    │   │   ├── FollowListDialog.tsx          # followers/following modal
    │   │   └── ProfilePostsGrid.tsx
    │   │
    │   ├── groups/
    │   │   ├── GroupCard.tsx                 # browse-groups list item
    │   │   ├── GroupHeader.tsx
    │   │   ├── MemberList.tsx
    │   │   ├── InviteDialog.tsx
    │   │   ├── JoinRequestList.tsx           # creator-only accept/decline
    │   │   ├── EventCard.tsx
    │   │   └── CreateEventForm.tsx
    │   │
    │   ├── chat/
    │   │   ├── ConversationList.tsx
    │   │   ├── ChatWindow.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── MessageComposer.tsx           # includes emoji picker
    │   │   └── GroupChatWindow.tsx
    │   │
    │   └── notifications/
    │       ├── NotificationList.tsx
    │       └── NotificationItem.tsx          # follow req / invite / join req / event
    │
    ├── context/
    │   ├── Auth.tsx                          # user, login, register, logout
    │   └── Socket.tsx                        # one WS connection, shared via context
    │
    ├── hooks/
    │   ├── useRequireGuest.ts                # (auth) pages bounce logged-in users
    │   ├── useRequireAuth.ts                 # (main) pages bounce logged-out users
    │   ├── useFollowStatus.ts
    │   └── useNotifications.ts               # subscribes to Socket, exposes unread count
    │
    ├── services/
    │   ├── http.ts                           # fetch wrapper: request(), ApiError, NetworkError
    │   ├── api.ts                            # barrel: re-exports every *Api below
    │   ├── auth.ts                           # authApi
    │   ├── profile.ts                        # profileApi
    │   ├── follow.ts                         # followApi
    │   ├── posts.ts                          # postsApi
    │   ├── groups.ts                         # groupsApi
    │   ├── chat.ts                           # chatApi
    │   ├── notifications.ts                  # notificationsApi
    │   └── socket.ts                         # WebSocket connect/reconnect logic
    │
    ├── styles/
    │   ├── globals.css                       # entry point — imports below, nothing else
    │   ├── tokens.css                        # :root raw values (colors, gradient, radii)
    │   ├── theme.css                         # @theme inline — maps tokens to utility names
    │   ├── base.css                          # @layer base — resets, ::selection, etc.
    │   └── utilities.css                     # @utility gradient / field / glow / ambient-brand
    │
    ├── types/
    │   ├── user.ts                           # User, Profile, FollowStatus, Register/LoginPayload
    │   ├── post.ts                           # PostSummary, Comment, Privacy
    │   ├── group.ts                          # Group, GroupEvent, Invite, JoinRequest
    │   ├── chat.ts                           # Message, Conversation
    │   └── notification.ts                   # Notification, NotificationType
    │
    ├── utils/
    │   ├── validation.ts                     # mirrors backend/pkg/auth/validate.go
    │   ├── formatDate.ts                     # relative timestamps for posts/messages
    │   └── avatar.ts                         # initials fallback, URL building
    │
    └── assets/
        └── icons/                            # any SVGs not from lucide-react

## What Each Folder Is For
(check resources.md for better explanation)
app/         → where pages live
components/  → what users see
services/    → what the application does with that data
hooks/       → reusable React behaviour
context/     → shared React state
types/       → what the data looks like
utils/       → small reusable helpers
assets/      → static frontend resources like images