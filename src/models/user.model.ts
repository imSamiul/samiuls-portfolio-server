import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserMethodsType, UserModelType, UserType } from '../types/userType';

// Define base UserType schema
const userSchema = new mongoose.Schema<
  UserType,
  UserModelType,
  UserMethodsType
>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function hashPassword(next) {
  // this gives to individual UserType that i will save
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }

  next();
});
userSchema.methods.generateAuthToken = async function generateAuthToken() {
  return jwt.sign({ id: this.id.toString() }, env.JWT_TOKEN, {
    expiresIn: '7d',
  });
};

userSchema.methods.toJSON = function toJSON() {
  const userObject: Partial<UserType> = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function (
  email: string,
  password: string,
) {
  const foundUser = await this.findOne({ email });
  if (!foundUser) {
    return null;
  }
  const isMatch = await bcrypt.compare(password, foundUser.password);
  if (!isMatch) {
    return null;
  }

  return foundUser;
};

// Create the base model
const User = mongoose.model<UserType, UserModelType>('User', userSchema);

export default User;
