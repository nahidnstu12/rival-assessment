import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { router } from "./router.js";
import { LOCAL_UPLOAD_ROOT } from "./storage/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  // Serve files written by the LocalAdapter. Inactive when STORAGE_DRIVER=cloudinary
  // (no files land here), but harmless to mount unconditionally.
  app.use("/uploads", express.static(LOCAL_UPLOAD_ROOT));

  app.use(router);
  app.use(errorHandler);

  return app;
}
