# Security Specification for BC Africa Music

## 1. Data Invariants

1. **User Identity & Role Binding**:
   - A user profile at `/users/{userId}` can only be created by the authenticated user whose `request.auth.uid == userId`.
   - Regular users cannot elevate their role to `admin` during registration or update. The `admin` role is reserved for pre-authorized accounts (e.g., `bcafricao@gmail.com`) or designated in `/admins/{adminId}`.
   - Profile updates must not alter immutable identity keys (`uid`, `email`).

2. **Track Ownership & Content Integrity**:
   - Only authenticated users with the `creator` or `admin` role can create new tracks.
   - Any track created must bind `ownerId` strictly to `request.auth.uid`.
   - Tracks can only be updated or deleted by their author/owner (`resource.data.ownerId == request.auth.uid`) or by an Admin.
   - Lyric timestamps and text updates can only be committed by the track owner or an admin.
   - Tracks are readable publicly by listeners to stream and view lyrics.

3. **Admin Exclusivity**:
   - `/admins/{adminId}` records can only be read/managed by verified administrators.

---

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)

1. **Payload 1: Unauthenticated Profile Creation**
   - Attempting to write `/users/attacker123` with no `request.auth`.
   - Expected: `PERMISSION_DENIED`.

2. **Payload 2: Identity Impersonation on Profile**
   - User `uid_alice` attempting to create `/users/uid_bob`.
   - Expected: `PERMISSION_DENIED`.

3. **Payload 3: Self-Assigned Super Admin Privilege**
   - Regular user attempting to set `role: "admin"` in their own profile creation.
   - Expected: `PERMISSION_DENIED` unless email is verified bootstrap admin (`bcafricao@gmail.com`).

4. **Payload 4: Shadow Field Injection in Profile**
   - Sending `{ ...validProfile, isSuperUser: true, bypassQuota: true }`.
   - Expected: `PERMISSION_DENIED` via `hasOnly()` key guard.

5. **Payload 5: Malicious Gigantic String Injection (Denial of Wallet)**
   - Sending `displayName` with 50KB character string.
   - Expected: `PERMISSION_DENIED` via `size() <= 100`.

6. **Payload 6: Listener Attempting Track Upload**
   - User with `role: "listener"` attempting to write to `/tracks/{trackId}`.
   - Expected: `PERMISSION_DENIED` (only creators/admins allowed to publish).

7. **Payload 7: Track Author Spoofing**
   - User `uid_charlie` submitting track with `ownerId: "uid_davido"`.
   - Expected: `PERMISSION_DENIED` via `incoming().ownerId == request.auth.uid`.

8. **Payload 8: Unauthorized Lyric Modification on Someone Else's Song**
   - User `uid_eve` attempting to update lyrics on track owned by `uid_burna`.
   - Expected: `PERMISSION_DENIED`.

9. **Payload 9: Deleting Another User's Track**
   - User attempting to delete `/tracks/someTrackId` without ownership or admin rights.
   - Expected: `PERMISSION_DENIED`.

10. **Payload 10: Modifying Immutable Keys**
    - Updating track and changing `id` or `ownerId`.
    - Expected: `PERMISSION_DENIED` via `incoming().ownerId == existing().ownerId`.

11. **Payload 11: Attempting to Add Admin Record Directly**
    - Non-admin user writing to `/admins/{newAdminId}`.
    - Expected: `PERMISSION_DENIED`.

12. **Payload 12: Unauthenticated Track Deletion**
    - Guest user attempting to delete any track.
    - Expected: `PERMISSION_DENIED`.
