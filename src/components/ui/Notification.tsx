import React from 'react'
import { Snackbar, Alert } from '@mui/material'
import type { NotificationState } from '../../types'
import { UI_CONSTANTS } from '../../config'

interface NotificationProps {
  notification: NotificationState
  onClose: () => void
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={UI_CONSTANTS.NOTIFICATION_DURATION}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={notification.severity}
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  )
}

export default Notification 