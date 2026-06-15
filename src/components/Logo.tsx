export default function Logo({ width = 170 }: { width?: number }) {
  const height = (width * 70) / 200;
  return (
    <svg width={width} height={height} viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg">
      {/* D mark */}
      <rect x="8" y="12" width="4" height="30" rx="1.5" fill="#00E5CC" />
      <rect x="8" y="12" width="20" height="4" rx="1.5" fill="#00E5CC" />
      <rect x="8" y="38" width="20" height="4" rx="1.5" fill="#00E5CC" />
      <rect x="24" y="12" width="4" height="13" rx="1.5" fill="#00E5CC" />
      <rect x="24" y="29" width="4" height="13" rx="1.5" fill="#00E5CC" />
      {/* DeerCo wordmark */}
      <text x="42" y="36" fontSize="22" fontWeight="700" fill="#ffffff" fontFamily="system-ui,-apple-system,Helvetica,sans-serif" letterSpacing="-0.5">Deer</text>
      <text x="96" y="36" fontSize="22" fontWeight="700" fill="#00E5CC" fontFamily="system-ui,-apple-system,Helvetica,sans-serif" letterSpacing="-0.5">Co</text>
      {/* SOLUTIONS */}
      <text x="43" y="52" fontSize="8" fontWeight="400" fill="#8a93a3" fontFamily="system-ui,-apple-system,Helvetica,sans-serif" letterSpacing="4">SOLUTIONS</text>
    </svg>
  );
}
