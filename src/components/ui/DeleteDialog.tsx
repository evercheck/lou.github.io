import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Button } from '@mui/material'
import type { DeleteDialogState } from '../../types'

interface DeleteDialogProps {
  dialog: DeleteDialogState
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ 
  dialog, 
  onConfirm, 
  onCancel, 
  isPending = false 
}) => {
  return (
    <Dialog
      open={dialog.open}
      onClose={onCancel}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">
        Delete Test Run
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          Are you sure you want to delete the test run "{dialog.testRunName}" (ID: {dialog.testRunId})?
          <br />
          <strong>This action cannot be undone.</strong>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error" 
          variant="contained"
          disabled={isPending}
        >
          {isPending ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteDialog 