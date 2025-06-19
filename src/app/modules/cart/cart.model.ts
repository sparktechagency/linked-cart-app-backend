import { Schema, model } from "mongoose";
import { CartModel, ICart } from "./cart.interface";

const cartSchema = new Schema<ICart>(
    {
        shop: { 
            type: Schema.Types.ObjectId, 
            ref: 'User', 
            required: true 
        },
        customer: {
            type: Schema.Types.ObjectId, 
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Cart = model<ICart, CartModel>('Cart', cartSchema);