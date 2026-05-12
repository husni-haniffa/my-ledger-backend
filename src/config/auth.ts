import { getAuth } from "@clerk/express";
import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../domain/errors/errors";

export const requireAuthentication = (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req)
    if (!auth.isAuthenticated) {
        throw new UnauthorizedError('Please sign in')
    }
    return next()
}

export const requireAuthorization = (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req)
    const role = (auth.sessionClaims?.metadata as { role?: string })?.role
    if (role !== "admin") {
        throw new ForbiddenError('Forbidden')
    }
    return next()
}