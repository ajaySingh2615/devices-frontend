"use client";

interface FeatureCardProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
}

export function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
}: FeatureCardProps) {
  return (
    <div className="feat-card reveal-up">
      <div className="feat-ic" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <h3 className="feat-title">{title}</h3>
      <p className="feat-sub">{sub}</p>
    </div>
  );
}
