import { USER_ROLES } from "../../../enums/user";
import { IShop, IUser } from "./user.interface";
import { JwtPayload } from 'jsonwebtoken';
import { Shop, User } from "./user.model";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiErrors";
import generateOTP from "../../../util/generateOTP";
import { emailTemplate } from "../../../shared/emailTemplate";
import { emailHelper } from "../../../helpers/emailHelper";
import unlinkFile from "../../../shared/unlinkFile";
import { IChangePassword } from "../../../types/auth";
import bcrypt from 'bcrypt';
import config from "../../../config";
import stripe from "../../../config/stripe";


const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
    const createUser = await User.create(payload);
    if (!createUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
    }

    //send email
    const otp = generateOTP();
    const values = {
        name: createUser.name,
        otp: otp,
        email: createUser.email!
    };

    const createAccountTemplate = emailTemplate.createAccount(values);
    emailHelper.sendEmail(createAccountTemplate);

    //save to DB
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 3 * 60000),
    };

    await User.findOneAndUpdate(
        { _id: createUser._id },
        { $set: { authentication } }
    );

    return createUser;
};

const getUserProfileFromDB = async (user: JwtPayload): Promise<Partial<IUser>> => {
    const { id } = user;
    const shopId= id;
    const shop = await Shop.findById(shopId);
    console.log("shop", shop)

    const isExistUser: any = await User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
};

const updateProfileToDB = async (user: JwtPayload, payload: Partial<IUser>): Promise<Partial<IUser | null>> => {
    const { id } = user;
    const isExistUser = await User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //unlink file here
    if (payload.profile) {
        unlinkFile(isExistUser.profile);
    }

    const updateDoc = await User.findOneAndUpdate(
        { _id: id },
        payload,
        { new: true }
    );
    return updateDoc;
};


const changePasswordToDB = async (user: JwtPayload, payload: IChangePassword) => {

    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = await User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //current password match
    if (currentPassword && !(await User.isMatchPassword(currentPassword, isExistUser.password))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }

    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }

    //new password and confirm password check
    if (newPassword !== confirmPassword) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }

    //hash password
    const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

    const updateData = {
        password: hashPassword,
    };

    await User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
};

// delete user
const deleteUserFromDB = async (user: JwtPayload, password: string) => {

    if (!password) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid Password")
    }

    const isExistUser = await User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }

    //check match password
    if (password && !(await User.isMatchPassword(password, isExistUser.password))) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }

    const updateUser = await User.findByIdAndDelete(user.id);
    if (!updateUser) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return;
};

const shopUpdateToDB = async (user: JwtPayload, payload: IShop) => {

    const shopId = user.id;
    const shop = await Shop.findByIdAndUpdate(
        shopId,
        payload,
        { new: true }
    );

    if(!shop){
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update shop information")
    }
}

const addStripeAccountToDB = async (user: JwtPayload) => {
    // Check if this user exists
    const existingUser: any = await User.findById(user.id).select("+accountInformation").lean();
    if (existingUser?.accountInformation?.accountUrl) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "You already connected your bank on Stripe.");
    }

    // Create account for Canada
    const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user?.email,
        business_type: "individual",
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        }
    });

    if (!account) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create account.");
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'http://10.0.80.75:5000/failed',
        return_url: 'https://10.0.80.75:5000/success',
        type: 'account_onboarding',
    });

    // Update the user account with the Stripe account ID
    const updateAccount = await User.findOneAndUpdate(
        { _id: user.id },
        { "accountInformation.stripeAccountId": account.id },
        { new: true }
    );

    if (!updateAccount) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update account.");
    }

    return accountLink?.url; // Return the onboarding link
}


export const UserService = {
    createUserToDB,
    getUserProfileFromDB,
    updateProfileToDB,
    changePasswordToDB,
    deleteUserFromDB,
    shopUpdateToDB,
    addStripeAccountToDB
};