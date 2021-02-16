export default function Container ({ children }) {
  return (
    <div>
      {children}
      <style jsx>{`
        div {
          padding: 20px;
        }
      `}</style>
    </div>
  )
}