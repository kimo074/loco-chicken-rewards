import { NextFunction, Request, Response } from "express";
import { AdminTokenPayload, CustomerTokenPayload, StaffTokenPayload, verifyToken } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: CustomerTokenPayload | StaffTokenPayload | AdminTokenPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "CUSTOMER") {
      res.status(403).json({ error: "Customer access required" });
      return;
    }
    next();
  });
}

export function requireStaff(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "STAFF") {
      res.status(403).json({ error: "Staff access required" });
      return;
    }
    next();
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "ADMIN") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export function requireFullAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.auth?.role !== "ADMIN" || req.auth.level !== "full") {
      res.status(403).json({ error: "Full admin access required" });
      return;
    }
    next();
  });
}
