export default function Input ({...props}) {
  return <>
    <input {...props} />
    <style jsx>{`
      input {
        width: 100%;
        border: none;
        background-color: var(--dark-bg);
        border-radius: 4px;
        // font-family: var(--body-font);
        font-size: 15px;
        font-weight: 500;
        padding: 0 20px;
        box-shadow: 0 0 0 2px rgb(134 140 160 / 2%);
        background-size: 14px;
        line-height: 40px;
        background-repeat: no-repeat;
        background-position: 16px 48%;
        color: var(--active-color);
        outline: none; 
      }
    `}</style>
  </>
}