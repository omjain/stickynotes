import { useEffect } from 'react'

import { Workspace } from '../components/NoteList/Workspace'
import { useFlushOnHide } from '../hooks/useFlushOnHide'
import { notes } from '../stores/notes'

export function App() {
  useEffect(() => {
    void notes.hydrate()
  }, [])

  useFlushOnHide()

  return <Workspace />
}
