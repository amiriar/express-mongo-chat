import { Schema, model, Document } from 'mongoose';

// Define the Permissions schema
const permissionsSchema = new Schema({
  name: { type: String, required: true, unique: true },
}, {
  timestamps: true,
});

// Define the Permissions model interface
interface IPermissions extends Document {
  name: string;
}

// Create the Permissions model
const PermissionsModel = model<IPermissions>('Permissions', permissionsSchema);

export { PermissionsModel, IPermissions };
