type Props = { name: "arrow" | "leaf" | "arch" | "calendar" | "pin" | "plus"; className?: string };

const paths = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  leaf: "M20 3C10 3 3 8 5 15c2 7 14 5 15-12ZM5 20 16 9M10 14l-1-5m1 5 5 1",
  arch: "M5 21V10a7 7 0 0 1 14 0v11M2 21h20M9 21V11a3 3 0 0 1 6 0v10",
  calendar: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4m10-4v4M3 10h18M8 15h2m4 0h2",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  plus: "M12 5v14M5 12h14",
};

export function Icon({ name, className = "" }: Props) {
  return <svg className={`site-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
