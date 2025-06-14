import { model, Schema } from "mongoose";
import { USER_ROLES } from "../../../enums/user";
import { IShop, IUser, UserModal } from "./user.interface";
import bcrypt from "bcrypt";
import ApiError from "../../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import config from "../../../config";

const userSchema = new Schema<IUser, UserModal>(
    {
        name: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        contact: {
            type: String,
            required: false,
        },
        password: {
            type: String,
            required: true,
            select: 0,
            minlength: 8,
        },
        profile: {
            type: String,
            default: 'https://res.cloudinary.com/dzo4husae/image/upload/v1733459922/zfyfbvwgfgshmahyvfyk.png',
        },
        verified: {
            type: Boolean,
            default: false,
        },
        deviceToken: {
            type: String,
            required: false
        },
        authentication: {
            type: {
                isResetPassword: {
                    type: Boolean,
                    default: false,
                },
                oneTimeCode: {
                    type: Number,
                    default: null,
                },
                expireAt: {
                    type: Date,
                    default: null,
                },
            },
            select: 0
        },
        accountInformation: {
            status: { type: Boolean },
            stripeAccountId: { type: String },
            accountUrl: { type: String },
            externalAccountId: { type: String }
        }
    },
    {
        timestamps: true,
        discriminatorKey: 'role',
    }
)





//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
    const isExist = await User.findById(id);
    return isExist;
};
  
userSchema.statics.isExistUserByEmail = async (email: string) => {
    const isExist = await User.findOne({ email });
    return isExist;
};
  
//account check
userSchema.statics.isAccountCreated = async (id: string) => {
    const isUserExist:any = await User.findById(id);
    return isUserExist.accountInformation.status;
};
  
//is match password
userSchema.statics.isMatchPassword = async ( password: string, hashPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashPassword);
};
  
//check user
userSchema.pre('save', async function (next) {

    if (this.role === USER_ROLES.CUSTOMER) {
        if (!this.accountInformation) {
            this.accountInformation = {};
        }
        this.accountInformation.status = false;
    }

    //check user
    const isExist = await User.findOne({ email: this.email });
    if (isExist) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
    }
  
    //password hash
    this.password = await bcrypt.hash( this.password, Number(config.bcrypt_salt_rounds));
    next();
});


export const User = model<IUser, UserModal>("User", userSchema);

const shopSchema = new Schema<IShop>(
    {
        shopImage: { type: String, required: false },
        shopName: { type: String, required: false },
        tradeLicense: { type: Number, required: false },
        bin: { type: Number, required: false },
        shopContact: { type: String, required: false },
        address: { type: String, required: false }
    },
    { _id: false }
);

const emptySchema = new Schema({}, { _id: false });

User.discriminator(USER_ROLES.SUPER_ADMIN, emptySchema);
User.discriminator(USER_ROLES.ADMIN, emptySchema);
User.discriminator(USER_ROLES.CUSTOMER, emptySchema);
User.discriminator(USER_ROLES.SHOPPER, emptySchema);

export const Shop = User.discriminator(USER_ROLES.SHOP, shopSchema);