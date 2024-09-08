import autoBind from "auto-bind";
import UserModel from "../models/user.model";
import createHttpError from "http-errors";

class UserService {
  #model;

  constructor() {
    autoBind(this);
    this.#model = UserModel;
  }

  async dashboard(data: any, user: any) {
    const updateResult = await this.#model.updateOne(
      { _id: user._id },
      { $set: data }
    );
    if (updateResult.modifiedCount === 0) return new createHttpError[500]();
    return updateResult;
  }
}

export default new UserService();
