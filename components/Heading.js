export default function Heading ({ size = 1, children, ...props }) {
  const H = `h${size}`

  return (
    <H {...props}>
      {children}
      <style jsx>{`
        h1 {
          margin: 0;
          color: var(--active-color);
        }
        h2 {
          margin: 0;
          color: var(--active-color);
          font-size: 16px;
        }
      `}</style>
    </H>
  )
}
