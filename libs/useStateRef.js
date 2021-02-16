import { useEffect, useState, useRef } from 'react'

export default function useStateRef(initialValue) {
  const [value, setValue] = useState(initialValue)

  const ref = useRef(value)

  useEffect(() => {
    ref.current = value
  }, [value])

  return [value, setValue, ref]
}
