import { z } from "zod";
import { checkValidID } from "../../../shared/checkValidID";

const createCartZidValidation = z.object({
    body: z.object({
        product: checkValidID("Product ID is required"),
        quantity: z.number({required_error: "Quantity is required"}),
        size: z.string({required_error: "Size is required"}),
        color: z.string({required_error: "Color is required"}),
    })
});

export const CartValidation = {
    createCartZidValidation
}