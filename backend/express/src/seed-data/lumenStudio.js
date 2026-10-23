import { NO_MODULES } from './constants.js'

// Newly onboarded agency with no modules purchased yet — the dashboard home
// shows its "No modules active yet" empty state and every nav item is locked.

export default {
  id: 'biz-lumen-studio',
  name: 'Lumen Design Studio',
  verificationLevel: 'BASIC',
  recruitmentModelType: 'INTERNAL',
  flags: NO_MODULES,

  accounts: [
    {
      // Profile only partly filled in, initials avatar.
      email: 'tara.malhotra@lumenstudio.co',
      role: 'OWNER',
      firstName: 'Tara',
      lastName: 'Malhotra',
      jobTitle: 'Founder & Creative Director',
      location: 'Mumbai — Bandra West',
      timezone: 'Asia/Kolkata',
    },
    {
      // Blank profile — the sidebar falls back to the email address.
      email: 'studio.ops@lumenstudio.co',
      role: 'OPERATIONS_MANAGER',
    },
  ],
}
