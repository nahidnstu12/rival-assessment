## Phase 7 — Task Attachments

> Goal: upload images/docs to a task. One UI, two storage backends (local for dev, Cloudinary for prod) selected by env. Frontend never knows the difference.

---

## Why two backends

- **Local** — offline dev, no internet, no quota concerns
- **Cloudinary** — production (Render disk is ephemeral, files would die on restart)

Same `Storage` adapter interface, swapped at boot. One env var picks the driver.

```
STORAGE_DRIVER=local       # default in .env.local
STORAGE_DRIVER=cloudinary   # set in Render env
```

---

## Model

```prisma
model TaskAttachment {
  id         String    @id @default(cuid())
  taskId     String
  uploaderId String
  filename   String    // original name shown in UI
  url        String    // public URL (local served path OR cloudinary URL)
  publicId   String?   // cloudinary public_id, needed for delete
  size       Int       // bytes
  mimeType   String
  storage    Storage   // dispatch on delete
  createdAt  DateTime  @default(now())

  task     Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader User @relation(fields: [uploaderId], references: [id])

  @@index([taskId, createdAt])
}

enum Storage { LOCAL CLOUDINARY }
```

---

## Storage adapter (the core abstraction)

```ts
interface StorageAdapter {
  upload(file: Buffer, meta: { filename, mimeType }): Promise<UploadResult>
  delete(publicId: string): Promise<void>
}

type UploadResult = { url: string, publicId?: string, size: number, storage: Storage }
```

At boot:
```ts
const storage: StorageAdapter =
  process.env.STORAGE_DRIVER === "cloudinary" ? new CloudinaryAdapter() : new LocalAdapter()
```

Routes call `storage.upload(...)` — never branch on driver themselves.

---

## Local adapter (dev)

- [ ] `multer` with disk storage to `backend/uploads/{taskId}/{cuid}.{ext}`
- [ ] Express serves: `app.use("/uploads", express.static("uploads"))`
- [ ] Returns `url = "/uploads/{taskId}/{cuid}.{ext}"`, `storage = LOCAL`
- [ ] `.gitignore` the `uploads/` folder
- [ ] On delete: `fs.unlink(path)`

## Cloudinary adapter (prod)

- [ ] `cloudinary` SDK + unsigned upload preset (so frontend can upload direct)
- [ ] Backend signs OR frontend uploads direct with preset — pick one (recommend direct for less Render memory)
- [ ] Store returned `secure_url` + `public_id`
- [ ] On delete: `cloudinary.uploader.destroy(publicId)`

---

## Validation (both adapters)

- [ ] Max file size: **5 MB** (multer + frontend pre-check)
- [ ] Allowed mime: `image/jpeg, image/png, image/webp, application/pdf, text/plain`
- [ ] Max attachments per task: **10**
- [ ] Reject with `413` for size, `415` for mime, `409` for over-limit count
- [ ] Use existing error envelope: `{ error: { code, message } }`

---

## Backend routes

- [ ] `POST /tasks/:id/attachments` — multipart form, ownership-checked, runs through adapter
- [ ] `GET /tasks/:id/attachments` — list, ordered newest first
- [ ] `DELETE /tasks/:id/attachments/:attachmentId` — dispatch delete on the matching adapter via `storage` enum
- [ ] All routes use `requireAuth + requireApproved`
- [ ] Admin can upload/delete on any task (uses `actorId` from JWT for `uploaderId`)
- [ ] Log to `TaskActivity` — `ATTACHMENT_ADDED` / `ATTACHMENT_REMOVED` with `{ filename }` in `changes`

---

## Frontend

- [ ] Add **Attachments** section to edit sheet (above the activity list)
- [ ] Drag-drop zone + "Add file" button — same component
- [ ] Pre-validate size + mime in browser before upload
- [ ] Show progress bar (single upload at a time is fine)
- [ ] List: thumbnail for `image/*`, file icon for PDF/text + filename + size
- [ ] Click filename → open in new tab
- [ ] Delete button per row, confirm on click
- [ ] After upload/delete: invalidate task + activity queries

---

## Done when

- `STORAGE_DRIVER=local` → upload an image → appears in list with thumbnail, file lives in `backend/uploads/`
- `STORAGE_DRIVER=cloudinary` → same UX, URL is `https://res.cloudinary.com/...`
- Delete attachment → file gone from storage AND row gone
- Delete the parent task → all attachments cascade gone (DB row + try to clean up storage)
- 6 MB file → 413 with clear message
- `.exe` file → 415 rejection
- Activity log shows "You added screenshot.png" after upload

---

## Trade-offs (interview-ready)

1. **Two adapters, one interface** — dev offline, prod scalable, no code drift
2. **Direct-to-Cloudinary upload** — frontend uploads straight to Cloudinary, backend just records metadata. Saves Render memory.
3. **`storage` enum on the row** — must know which backend a file lives in to delete it later; otherwise a Cloudinary file would never be cleaned up
4. **5 MB / 10 files cap** — assessment scale; production would use chunked uploads + lifecycle policies
5. **Cascade on task delete** — DB rows go via Prisma; storage cleanup is best-effort (a worker would handle retries in prod)

---

## Out of scope

- Virus scanning (ClamAV / Cloudinary's built-in moderation)
- EXIF stripping on images
- Server-side image resize (Cloudinary transforms cover the demo case)
- Signed URLs for private attachments — all uploads are public-by-URL here
- Resumable / chunked uploads
- Multi-file parallel upload
