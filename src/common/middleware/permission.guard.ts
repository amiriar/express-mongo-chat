import createHttpError from 'http-errors';
import { Request, Response, NextFunction } from 'express';
import { PERMISSIONS } from '../constant/constans';
import { RoleModel } from 'module/models/role.model';
import { PermissionsModel } from 'module/models/permissions.model';

interface CustomRequest extends Request {
  user?: any;
}

export function checkPermission(requiredPermissions: string[] = []) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allPermissions = requiredPermissions.flat(2);
      const user = req.user as any;
      if (user) {
        const role: any = await RoleModel.findOne({ title: user.role });
        const permissions = await PermissionsModel.find({ _id: { $in: role.permissions } });
        const userPermissions = permissions.map(item => item.name);
        const hasPermission = allPermissions.every(permission => userPermissions.includes(permission));

        if (userPermissions.includes(PERMISSIONS.ALL)) return next();
        if (allPermissions.length === 0 || hasPermission) return next();
        throw createHttpError.Forbidden('شما به این قسمت دسترسی ندارید');
      } else {
        throw createHttpError.Unauthorized('ابتدا وارد حساب کاربری خود شوید!');
      }
    } catch (error) {
      next(error);
    }
  };
}
