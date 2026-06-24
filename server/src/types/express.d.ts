// this is a declaration file, adds the user and session fields into Express's Request object.

import { auth } from "../lib/auth.ts";

type Session = typeof auth.$Infer.Session;

declare global{
    namespace Express{
        interface Request{
            user: Session["user"],
            session: Session["session"],
        }
    }
}