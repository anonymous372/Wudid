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
  name: { type: String, default: '' },
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


const taskSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  text: { type: String, required: true },
  is_completed: { type: Boolean, default: false },
  label_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Label', default: null },
  created_at: { type: Date, default: Date.now }
});
taskSchema.set('toJSON', toJSONOptions);

const habitSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['boolean', 'numeric'], required: true },
  unit: { type: String, default: '' },
  target_value: { type: Number, default: null },
  target_type: { type: String, enum: ['daily_quota', 'milestone', null], default: null },
  icon: { type: String, default: 'Activity' },
  color: { type: String, default: '#3b82f6' },
  frequency: { type: String, default: 'daily' },
  is_archived: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});
habitSchema.set('toJSON', toJSONOptions);

const habitLogSchema = new mongoose.Schema({
  habit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  value_bool: { type: Boolean, default: null },
  value_num: { type: Number, default: null },
  notes: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now }
});
habitLogSchema.index({ habit_id: 1, date: 1 }, { unique: true });
habitLogSchema.set('toJSON', toJSONOptions);

module.exports = {
  User: mongoose.model('User', userSchema),
  MagicLink: mongoose.model('MagicLink', magicLinkSchema),
  Label: mongoose.model('Label', labelSchema),
  Event: mongoose.model('Event', eventSchema),
  Task: mongoose.model('Task', taskSchema),
  Habit: mongoose.model('Habit', habitSchema),
  HabitLog: mongoose.model('HabitLog', habitLogSchema)
};
