export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  checks: { label: string; passed: boolean }[];
};

const LABELS: PasswordStrength["label"][] = ["Too short", "Weak", "Fair", "Good", "Strong"];

const COMMON = ["password", "123456", "qwerty", "letmein", "welcome", "admin", "abc123"];

export function evaluatePassword(password: string): PasswordStrength {
  const checks = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "Upper and lower case letters", passed: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", passed: /\d/.test(password) },
    { label: "A symbol", passed: /[^A-Za-z0-9]/.test(password) }
  ];

  let score = checks.filter((check) => check.passed).length;

  if (password.length >= 14 && score >= 3) {
    score += 1;
  }
  if (COMMON.some((word) => password.toLowerCase().includes(word)) || /(.)\1{3,}/.test(password)) {
    score = Math.min(score, 1);
  }
  if (password.length < 8) {
    score = 0;
  }

  const bounded = Math.max(0, Math.min(4, score)) as PasswordStrength["score"];
  return { score: bounded, label: LABELS[bounded], checks };
}

const BAR_COLORS = ["bg-rose-500", "bg-rose-500", "bg-amber-400", "bg-lime-400", "bg-emerald-400"];
const TEXT_COLORS = ["text-rose-300", "text-rose-300", "text-amber-300", "text-lime-300", "text-emerald-300"];

type PasswordStrengthMeterProps = {
  password: string;
  showChecklist?: boolean;
  className?: string;
};

export default function PasswordStrengthMeter({
  password,
  showChecklist = true,
  className = ""
}: PasswordStrengthMeterProps) {
  if (!password) {
    return null;
  }

  const { score, label, checks } = evaluatePassword(password);

  return (
    <div className={`space-y-2 ${className}`} aria-live="polite">
      <div className="flex items-center gap-3">
        <div
          className="flex flex-1 gap-1"
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={score}
          aria-valuetext={label}
        >
          {[1, 2, 3, 4].map((segment) => (
            <span
              key={segment}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                segment <= score ? BAR_COLORS[score] : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <span className={`w-16 text-right text-xs font-semibold ${TEXT_COLORS[score]}`}>{label}</span>
      </div>

      {showChecklist ? (
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {checks.map((check) => (
            <li key={check.label} className={check.passed ? "text-emerald-300" : "text-slate-500"}>
              <span aria-hidden="true">{check.passed ? "✓" : "•"}</span> {check.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
