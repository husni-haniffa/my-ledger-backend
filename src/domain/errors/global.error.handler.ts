import { Request, Response, NextFunction } from "express";

const GlobalErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.log(error.name)
    console.log(error.message)
    console.log(error.cause)
    console.log(error.stack)
    switch (error.name) {
        case "BadRequestError":
            return res.status(400).json({ message: error.message.replace(/\n/g, "") });
        case "UnauthorizedError":
            return res.status(401).json({ message: error.message.replace(/\n/g, "") });
        case "ForbiddenError":
            return res.status(403).json({ message: error.message.replace(/\n/g, "") });
        case "NotFoundError":
            return res.status(404).json({ message: error.message.replace(/\n/g, "") })
        case "ConflictError":
            return res.status(409).json({ message: error.message.replace(/\n/g, "") })
        default:
            return res.status(500).json({ message: error.message.replace(/\n/g, "") });
    }
}

export default GlobalErrorHandler;