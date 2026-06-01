interface Props { className?: string; size?: number | string }

/** Tesla "T" mark — recreated in pure SVG. */
export default function TeslaLogo({ className, size = 96 }: Props) {
  return (
    <svg
      viewBox="0 0 342 342"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tesla"
    >
      {/* arched top crossbar */}
      <path
        fill="#E31937"
        d="M171 70c52 0 100 7 137 19l-19 33c-32-8-72-12-118-12s-86 4-118 12l-19-33C71 77 119 70 171 70Z"
      />
      {/* outer wing tips drop */}
      <path
        fill="#E31937"
        d="M58 117c10-3 21-6 33-8l9 19c-9 1-18 3-26 6l-16-17Zm226 0c-10-3-21-6-33-8l-9 19c9 1 18 3 26 6l16-17Z"
      />
      {/* central T spike */}
      <path
        fill="#E31937"
        d="M171 132c19 0 38 1 55 3l-16 28c-13-2-26-3-39-3s-26 1-39 3l-16-28c17-2 36-3 55-3Z"
      />
      <path
        fill="#E31937"
        d="M150 163c7-1 14-1 21-1s14 0 21 1l-21 109-21-109Z"
      />
    </svg>
  );
}
