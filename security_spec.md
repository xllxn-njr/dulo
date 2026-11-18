# Dulo Firestore Security Specification

## 1. Data Invariants
1. All user-synced documents (`/users/{uid}`, `/users/{uid}/liked_songs/{trackId}`, `/users/{uid}/playlists/{playlistId}`, `/users/{uid}/history/{historyId}`) belong strictly to the authenticated user matching `request.auth.uid == uid`.
2. Every document must embed `uid == request.auth.uid` and preserve `uid` as immutable on update.
3. No unauthenticated access is permitted anywhere; default catch-all denies all reads and writes.
4. All string fields enforce explicit `.size()` bounds; `tracks` lists in playlists are bounded to `<= 200` items.
5. Temporal fields (`createdAt`, `updatedAt`, `likedAt`, `playedAt`) must equal `request.time` (server timestamps).

## 2. Adversarial Payloads Tested (Dirty Dozen)
1. Cross-user read on `/users/{otherUid}/liked_songs/{id}` -> DENIED
2. Cross-user write with spoofed `uid` -> DENIED
3. Unauthenticated list on `/users/{uid}/playlists` -> DENIED
4. Ghost field injection (`isAdmin: true`) on `UserAccount` -> DENIED (`hasOnly`)
5. Oversized ID injection (`1500` char `trackId`) -> DENIED (`isValidId`)
6. Oversized title (`500` char `title`) on `LikedSong` -> DENIED (`title.size() <= 240`)
7. Client-forged timestamp (`likedAt: "2020-01-01"`) -> DENIED (`likedAt == request.time`)
8. Mutating `uid` or `createdAt` on `Playlist` update -> DENIED (immutability gate)
9. Invalid `source` enum (`"pirated"`) -> DENIED (`in ['demo', 'piped', 'proxy', 'local']`)
10. Unbounded playlist `tracks` array (`250` items) -> DENIED (`tracks.size() <= 200`)
11. Negative `duration` or `playCount` -> DENIED (`>= 0` / `>= 1`)
12. Wildcard collection read/write on `/test/connection` or unknown path -> DENIED
