import express, { NextFunction, Response, Request } from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { changePasswordZodValidationSchema, userZodValidationSchema } from './user.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import fileUploadHandler from '../../middlewares/fileUploaderHandler';
import { getSingleFilePath } from '../../../shared/getFilePath';
import ApiError from '../../../errors/ApiErrors';
import { StatusCodes } from 'http-status-codes';
const router = express.Router();

router.route('/')
    .get(
        auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.SHOP, USER_ROLES.SHOPPER),
        UserController.getUserProfile
    )
    .post(
        validateRequest(userZodValidationSchema),
        UserController.createUser
    )
    .patch(
        auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.SHOP, USER_ROLES.SHOPPER),
        fileUploadHandler(),
        async (req: Request, res: Response, next: NextFunction) => {
            try {

                const profile = getSingleFilePath(req.files, "image");
                req.body = { ...req.body, profile };
                next();

            } catch (error) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to Process Profile Update");
            }
        },
        UserController.updateProfile
    );

router.post(
    '/change-password',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.CUSTOMER, USER_ROLES.SHOP, USER_ROLES.SHOPPER),
    validateRequest(changePasswordZodValidationSchema),
    UserController.changePassword
);

router.delete(
    '/delete-account',
    auth(USER_ROLES.CUSTOMER, USER_ROLES.SHOP, USER_ROLES.SHOPPER),
    UserController.deleteUser
);

router.get('/connected-account',
    auth(USER_ROLES.SHOP, USER_ROLES.SHOPPER),
    UserController.addStripeAccount
);

router.patch(
    '/update-profile',
    auth(USER_ROLES.SHOP),
    fileUploadHandler(),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const image = getSingleFilePath(req.files, "image");
            req.body = { ...req.body, shopImage: image };
            next();
        } catch (error) {
            throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to Process Shop Information");
        }
    },
    UserController.shopUpdate
);

export const UserRoutes = router;