const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const List = require('../models/List');
const notify = require('../utils/notify');

// Every minute: deliver due reminders
cron.schedule('* * * * *', async () => {
  try {
    const due = await Reminder.find({ sent: false, remindAt: { $lte: new Date() } });
    for (const r of due) {
      await notify(r.user, 'reminder', r.message, r.list);
      r.sent = true;
      await r.save();
    }
  } catch (e) { console.error('Reminder job error:', e.message); }
});

// Every day at 9 AM: alert about pending High-priority items
cron.schedule('0 9 * * *', async () => {
  try {
    const lists = await List.find({ items: { $elemMatch: { completed: false, priority: 'High' } } });
    for (const l of lists) {
      for (const i of l.items.filter(x => !x.completed && x.priority === 'High')) {
        await notify(
          i.assignedTo || l.owner, 'pending_item',
          `High priority item "${i.name}" is still pending in "${l.name}"`, l._id
        );
      }
    }
  } catch (e) { console.error('Pending job error:', e.message); }
});