import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Endpoints do Better Auth (login, logout, sessão) em /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth);
