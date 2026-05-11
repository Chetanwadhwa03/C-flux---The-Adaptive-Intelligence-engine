import type { Request, Response, NextFunction } from "express";
declare const Auth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export default Auth;
//# sourceMappingURL=Auth.d.ts.map