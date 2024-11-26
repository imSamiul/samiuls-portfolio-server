import mongoose, { Document, HydratedDocument, Model } from 'mongoose';

export type UserType = Document & {
  _id?: mongoose.Types.ObjectId;
  email: string;
  password: string;
  tokens: { token: string }[];
};

export type UserMethodsType = UserType & {
  generateAuthToken(): Promise<string>;
  toJSON: () => object;
};

export type UserInstanceType = HydratedDocument<UserType> & UserMethodsType;

export type UserModelType = Model<UserType, object, UserMethodsType> & {
  findByCredentials(
    email: string,
    password: string,
  ): Promise<HydratedDocument<UserType & UserMethodsType>>;
};
