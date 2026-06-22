const mongoose = require('mongoose');

const toJSONOptions = {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
};

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  created_at: { type: Date, default: Date.now }
});
userSchema.set('toJSON', toJSONOptions);

const magicLinkSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, unique: true, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false }
});
magicLinkSchema.set('toJSON', toJSONOptions);

const labelSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, required: true }
});
labelSchema.set('toJSON', toJSONOptions);

const eventSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  name: { type: String, required: true }
});
eventSchema.index({ user_id: 1, date: 1 }, { unique: true });
eventSchema.set('toJSON', toJSONOptions);

const checklistItemSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  text: { type: String, required: true },
  is_completed: { type: Boolean, default: false }
});
checklistItemSchema.set('toJSON', toJSONOptions);

const taskEntrySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  text: { type: String, required: true },
  label_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Label', default: null }
});
taskEntrySchema.set('toJSON', toJSONOptions);

module.exports = {
  User: mongoose.model('User', userSchema),
  MagicLink: mongoose.model('MagicLink', magicLinkSchema),
  Label: mongoose.model('Label', labelSchema),
  Event: mongoose.model('Event', eventSchema),
  ChecklistItem: mongoose.model('ChecklistItem', checklistItemSchema),
  TaskEntry: mongoose.model('TaskEntry', taskEntrySchema)
};
