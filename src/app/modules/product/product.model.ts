import { Schema, model } from "mongoose";
import { IProduct, ProductModel } from "./product.interface";
import config from "../../../config";

const productSchema = new Schema<IProduct, ProductModel>(
    {
        shop: { 
            type: Schema.Types.ObjectId,
            ref: "User", 
            required: true,
            immutable: true
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            immutable: true
        },
        image: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        discount: { type: Number, required: false },
        quantity: { type: Number, required: false },
        stock: { type: Boolean, default: true },
        status: {
            type: String,
            enum: ['Active', 'Delete'],
            default: "Active"
        }
    },
    {
        timestamps: true

    }
);

productSchema.post('find', function (product: IProduct) {
    product.image = `http://${config.ip_address}:${config.port}${product.image}`;
});

productSchema.post('find', function (products) {
    products.forEach((product: IProduct) => {
        if (product.image) {
            product.image = `http://${config.ip_address}:${config.port}${product.image}`;
        }
    });
});

export const Product = model<IProduct, ProductModel>('Product', productSchema);