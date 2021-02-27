import cc from 'classcat'

export default function Button ({ as, small, contrast, success, big, fullWidth, outline, avoid, children, className, ...props }) {
  const ButtonEl = as ? as : 'button'

  return (
    <ButtonEl className={cc([{ small, contrast, success, big, fullWidth, outline, avoid, disabled: props.disabled }, className, 'Button'])} {...props}>
      {children}
      <style jsx>{`
        .Button {
          background-color: var(--active-color);
          border: none;
          padding: 8px 26px;
          color: #000000;
          border-radius: 20px;
          cursor: pointer;
          transition: 0.3s;
          white-space: nowrap;
          outline: none;
          opacity: 0.85;
          text-decoration: none;
        }

        .Button:hover {
          opacity: 1;
        }

        .disabled {
          opacity: 0.25;
          cursor: unset;
        }
        .disabled:hover {
          opacity: 0.25;
        }

        .fullWidth {
          width: 100%;
        }

        .small {
          padding: 8px 12px;
        }

        .big {
          padding: 12px 30px;
          font-size: 1.2em;
        }

        .outline {
          background-color: transparent;
          box-shadow: 0 0 0 2px var(--active-color);
          color: var(--active-color);
        }
        .avoid {
          background-color: #f4313a;
          color: var(--active-color);
        }
        .success {
          background-color: #3bb173;
          color: var(--active-color);
        }
        .contrast {
          background-color: #000000;
          color: var(--active-color);
        }
        .contrast.outline {
          background-color: transparent;
          box-shadow: 0 0 0 2px #000000;
          color: #000000;
        }
      `}</style>
    </ButtonEl>
  )
}