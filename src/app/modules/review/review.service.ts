import mongoose from "mongoose";
import { IReview } from "./review.interface";
import { Review } from "./review.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";

const Product:any =[];

const createReviewToDB = async(payload:IReview): Promise<IReview>=>{

    const product:any = await Product.findById(payload.product);
    if (!product) {
        throw new ApiError(StatusCodes.NOT_FOUND, "No Product Found");
    }

    const result = await Review.create(payload);
    if(!result){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed To create Review")
    }
    return payload;
};


export const ReviewService ={ createReviewToDB}