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
      <style global jsx>{`
        :root {
          --active-color: #fefffe;
          --dark-bg: #14162b;
        }
        body {
          background: #355c7d; /* fallback for old browsers */
          background: -webkit-linear-gradient(to right, #355c7d, #6c5b7b, #c06c84); /* Chrome 10-25, Safari 5.1-6 */
          background: linear-gradient(to right, #355c7d, #6c5b7b, #c06c84); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
          color: var(--active-color);
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}