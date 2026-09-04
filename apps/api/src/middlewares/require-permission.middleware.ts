import type { Request, RequestHandler } from "express";
import { HttpError } from "../utils/http-error.util";
import { rbacService } from "../modules/sales-crm/rbac/rbac.service";

export type PermissionLoader = (userId: string) => Promise<readonly string[]>;

async function defaultLoadPermissions(userId: string): Promise<readonly string[]> {
  return rbacService.listPermissionCodesForUser(userId);
}

async function permissionsForRequest(
  req: Request,
  load: PermissionLoader,
): Promise<readonly string[]> {
  if (req.crmPermissionCodes) {
    return req.crmPermissionCodes;
  }

  if (!req.user) {
    req.crmPermissionCodes = [];
    return req.crmPermissionCodes;
  }

  const codes = await load(req.user.id);
  req.crmPermissionCodes = codes;
  return codes;
}

/**
 * CRM authorization. Mount after `requireAuth` on CRM routes only.
 * Loads permission codes per request (UserRole → RolePermission → Permission).
 * Do not put permissions in the JWT. Do not apply this to finance routes.
 */
export function createRequirePermission(load: PermissionLoader = defaultLoadPermissions) {
  return (code: string): RequestHandler => {
    return (req, _res, next) => {
      if (!req.user) {
        next(new HttpError(401, "Unauthenticated"));
        return;
      }

      void permissionsForRequest(req, load)
        .then((granted) => {
          if (!granted.includes(code)) {
            next(new HttpError(403, "Forbidden"));
            return;
          }
          next();
        })
        .catch(next);
    };
  };
}

export const requirePermission = createRequirePermission();
