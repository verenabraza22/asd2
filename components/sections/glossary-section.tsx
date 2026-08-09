'use client'

import { LibraryList } from '../library-list'

export function GlossarySection() {
  return (
    <LibraryList
      type="book"
      title="Glosario de libros"
      subtitle="Toca una portada para ver la ficha completa: sinopsis, valoración y tus reflexiones."
    />
  )
}
