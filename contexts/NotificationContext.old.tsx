// Legacy notification provider removed.
// This file is kept as a harmless placeholder so any imports won't pull
// in runtime EventSource/Socket.IO logic while you start a fresh implementation.

// Legacy notification provider removed and replaced with a harmless placeholder.
// Any imports of this file will get a no-op provider so runtime EventSource or
// Socket.IO code is not executed. Use `contexts/NotificationContext.tsx` for
// the active shim implementation.

import React from 'react';

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default NotificationProvider;