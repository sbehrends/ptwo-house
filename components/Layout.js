export default function Layout ({ children }) {
  return (
    <div className="container">
      <div className="app">
        {children}
      </div>
      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2em;
          width: 100%;
          heigh: 100vh;
        }
        .app {
          min-width: 320px;
          backdrop-filter: blur(20px);
          background: rgba(16 18 27 / 40%);
          border-radius: 14px;
        }
      `}</style>
      <style jsx global>{`
          :root {
            --active-color: #fefffe;
            --dark-bg: #14162b;
          }

          body {
            font-family: 'Poppins', sans-serif;
            background: #355c7d;
            background: -webkit-linear-gradient(to right, #355c7d, #6c5b7b, #c06c84);
            background: linear-gradient(to right, #355c7d, #6c5b7b, #c06c84);
            color: var(--active-color);
          }

          * {
            box-sizing: border-box;
          }
        `}</style>
    </div>
  )
}