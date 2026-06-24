import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export async function requireOrg(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if(!session){
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const orgId = req.headers["x-organization-id"] as string;
  if(!orgId){
    res.status(400).json({ error: "x-organization-id header required" });
    return;
  }

  // verify user is actually a member of this org
  const member = await auth.api.getActiveMember({
    headers: fromNodeHeaders(req.headers),
  });

  if(!member || member.organizationId !== orgId){
    res.status(403).json({ error: "Not a member of this organization" });
    return;
  }

  req.user = session.user;
  req.session = session.session;
  req.organizationId = orgId;
  req.memberRole = member.role;
  next();
}