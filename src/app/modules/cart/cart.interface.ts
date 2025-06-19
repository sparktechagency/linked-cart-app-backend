import { Model, Types } from "mongoose";

export type ICart ={
    _id?: Types.ObjectId;
    customer: Types.ObjectId;
    shop: Types.ObjectId;
}

export type CartModel = Model<ICart, Record<string, any>>;