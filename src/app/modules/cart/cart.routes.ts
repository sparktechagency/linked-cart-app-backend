import express from 'express';
import { CartController } from './cart.controller';
import { CartValidation } from './cart.validation';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middlewares/validateRequest';
const router = express.Router();

router.route('/')
    .post(
        auth(USER_ROLES.USER),
        validateRequest(CartValidation.createCartZidValidation),
        CartController.makeCart
    )
    .get(
        auth(USER_ROLES.USER),
        CartController.getCart
    )
    .patch(
        auth(USER_ROLES.USER),
        CartController.decreaseCartQuantity
    )
    .put(
        auth(USER_ROLES.USER),
        CartController.increaseCartQuantity
    )

router.route('/:id')
    .delete(
        auth(USER_ROLES.USER),
        CartController.deleteCart
    )
    


export const CartRoutes = router;
