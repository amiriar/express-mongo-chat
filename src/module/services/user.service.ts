import autoBind from 'auto-bind';
import UserModel from '../models/user.model';
import createHttpError from 'http-errors';
import { deleteFileInPublic } from '../../common/utils/functions';

class UserService {
  #model;

  constructor() {
    autoBind(this);
    this.#model = UserModel;
  }

  async dashboard(data: any, phone: string, profile: string) {
    if(profile){
      deleteFileInPublic(profile)
    }
    const updateResult = await this.#model.updateOne(
      { phoneNumber: phone },
      { $set: data },
    );
    if (updateResult.modifiedCount === 0) return new createHttpError[500]();
    return updateResult;
  }
}

export default new UserService();
