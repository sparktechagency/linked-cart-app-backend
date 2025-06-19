import mongoose from "mongoose";
import { ICart } from "./cart.interface";
import { Product } from "../product/product.model";
import { JwtPayload } from "jsonwebtoken";
import { Cart } from "./cart.model";
import { IProduct } from "../product/product.interface";

const makeCartToDB = async (user: JwtPayload, cart: ICart): Promise<ICart> => {

    if (!mongoose.Types.ObjectId.isValid(cart.product)) {
        throw new Error('Invalid product id');
    }

    const isExistProduct: IProduct | null = await Product.findById(cart.product).lean();
    if (!isExistProduct) {
        throw new Error('Product not found');
    }

    const payload = {
        name: isExistProduct.name,
        price: isExistProduct.price,
        image: isExistProduct.primary,
        quantity: cart.quantity,
        product: cart.product,
        color: cart.color,
        size: cart.size,
        user: user?.id
    }

    const isExistCart = await Cart.findOne({
        product: cart.product,
        user: user.id
    });

    if (isExistCart) {
        await Cart.findByIdAndUpdate(
            { _id: isExistCart?._id },
            {
                $inc: { quantity: Number(cart.quantity) }
            },
            { new: true }
        );
        return isExistCart;
    }

    const newCart: ICart = await Cart.create(payload);
    if (!newCart) {
        throw new Error('Failed to add product to cart');
    }

    return newCart
}

const deleteCartFromDB = async (user: JwtPayload, cart: ICart): Promise<ICart | null> => {

    if (!mongoose.Types.ObjectId.isValid(cart.product)) {
        throw new Error('Invalid product id');
    }

    const cartExist = await Cart.findOneAndDelete({
        product: cart.product,
        user: user._id
    });

    if (!cartExist) {
        throw new Error('Failed to delete product from cart');
    }

    return cartExist;
}

const decreaseCartQuantityFromDB = async (user: JwtPayload, productId: string): Promise<ICart | null> => {

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error('Invalid product id');
    }

    const cartExist = await Cart.findById(productId);

    if (!cartExist) {
        throw new Error('Product not found in cart');
    }

    if (cartExist.quantity <= 1) {
        await Cart.findOneAndDelete({ product: productId, user: user._id });
        return null;
    }

    
    const updatedCart = await Cart.findByIdAndUpdate(
        {_id : productId},
        {
            $inc: {
                quantity: -1
            }
        },
        { new: true }
    );

    return updatedCart;
};

const increaseCartQuantityFromDB = async (user: JwtPayload, productId: string): Promise<ICart | null> => {

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error('Invalid product id');
    }

    const cartExist = await Cart.findById(productId);

    if (!cartExist) {
        throw new Error('Product not found in cart');
    }
    
    const updatedCart = await Cart.findByIdAndUpdate(
        {_id : productId},
        {
            $inc: {
                quantity: + 1
            }
        },
        { new: true }
    );

    return updatedCart;
};


const getCartFromDB = async (user: JwtPayload): Promise<ICart[]> => {

    const cart = await Cart.find({ user: user.id })
        .select("name image price quantity color size")
        .lean();

    if (!cart) {
        throw new Error('No Data Found');
    }

    return cart;
}

export const CartService = {
    makeCartToDB,
    deleteCartFromDB,
    decreaseCartQuantityFromDB,
    getCartFromDB,
    increaseCartQuantityFromDB
};