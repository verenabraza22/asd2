'use client'

import { LibraryList } from '../library-list'

export function AudiobooksSection() {
  return (
    <LibraryList
      type="audiobook"
      title="Audiolibros"
      subtitle="Registra tus audiolibros con duración o capítulos. Toca la portada para ver el detalle."
    />
  )
}
