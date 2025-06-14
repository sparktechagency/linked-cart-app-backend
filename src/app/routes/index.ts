import express from 'express';
import { UserRoutes } from '../modules/user/user.routes';
import { AuthRoutes } from '../modules/auth/auth.routes';
import { BannerRoutes } from '../modules/banner/banner.routes';
import { CategoryRoutes } from '../modules/category/category.route';
import { ProductRoutes } from '../modules/product/product.routes';
import { RuleRoutes } from '../modules/rule/rule.route';
import { FaqRoutes } from '../modules/faq/faq.route';
const router = express.Router();

const apiRoutes = [
    { path: "/user", route: UserRoutes },
    { path: "/auth", route: AuthRoutes },
    { path: "/banner", route: BannerRoutes },
    { path: "/category", route: CategoryRoutes },
    { path: "/product", route: ProductRoutes },
    { path: "/rule", route: RuleRoutes },
    { path: "/faq", route: FaqRoutes },
]

apiRoutes.forEach(route => router.use(route.path, route.route));
export default router;