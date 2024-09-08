import createHttpError from 'http-errors';
import { PermissionsModel } from '../../modules/OtherModels/';
import { RoleModel } from '../../modules/OtherModels/role';
import { Request, Response, NextFunction } from 'express';
import { PERMISSIONS } from '../constant/constans';

interface CustomRequest extends Request {
  user?: any; // You can replace `any` with the specific type for `user`
}

export function checkPermission(requiredPermissions: string[] = []) {
  return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const allPermissions = requiredPermissions.flat(2);
      const user = req.user as any;
      if (user) {
        const role = await RoleModel.findOne({ title: user.role });
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
