import { Schema, model, Document } from 'mongoose';

// Define the Role schema
const roleSchema = new Schema({
  title: { type: String, required: true, unique: true },
  permissions: [{ type: Schema.Types.ObjectId, ref: 'Permissions' }],
}, {
  timestamps: true,
});

// Define the Role model interface
interface IRole extends Document {
  title: string;
  permissions: Schema.Types.ObjectId[];
}

// Create the Role model
const RoleModel = model<IRole>('Role', roleSchema);

export { RoleModel, IRole };
