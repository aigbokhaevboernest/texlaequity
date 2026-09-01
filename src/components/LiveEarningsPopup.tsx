import { useEffect, useRef, useState } from "react";
import { TrendingUp, DollarSign, UserPlus, ArrowDownToLine, Car, LineChart, X } from "lucide-react";

const NAMES = [
  "John", "Peter", "Michael", "Sofia", "Aisha", "Yuki", "Liam", "Marcus",
  "Elena", "Carlos", "Priya", "Amara", "David", "Noah", "Fatima", "Hiroshi",
  "Isabella", "Lucas", "Mei", "Omar", "Grace", "Anton", "Nadia", "Ravi",
];
const COUNTRIES = ["Italy", "Canada", "UAE", "Japan", "Germany", "Brazil", "Singapore", "France", "Spain", "Australia"];
const CAR_MODELS = ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Roadster"];

type ActionType = "earned" | "withdrew" | "deposit" | "joined" | "stock" | "car";

const ACTIONS: { type: ActionType; icon: typeof DollarSign; verb: string; isJoin?: boolean }[] = [
  { type: "earned", icon: DollarSign, verb: "just earned" },
  { type: "withdrew", icon: ArrowDownToLine, verb: "withdrew" },
  { type: "withdrew", icon: ArrowDownToLine, verb: "withdrew" }, // weighted slightly higher
  { type: "deposit", icon: TrendingUp, verb: "deposited" },
  { type: "joined", icon: UserPlus, verb: "joined from", isJoin: true },
  { type: "stock", icon: LineChart, verb: "bought" },
  { type: "car", icon: Car, verb: "ordered" },
];

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const randAmount = () => {
  // wider, more varied range instead of one flat 5k-95k band
  const bands = [
    () => (Math.floor(Math.random() * 40) + 1) * 100,      // 100 - 4,000
    () => (Math.floor(Math.random() * 90) + 5) * 1000,     // 5,000 - 95,000
    () => (Math.floor(Math.random() * 50) + 100) * 1000,   // 100,000 - 150,000
  ];
  return rand(bands)();
};

export const LiveEarningsPopup = () => {
  const [item, setItem] = useState<
    | {
        id: number;
        name?: string;
        country: string;
        verb: string;
        isJoin?: boolean;
        amount?: number;
        shares?: number;
        model?: string;
        Icon: typeof DollarSign;
        type: ActionType;
      }
    | null
  >(null);

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setItem(null);
  };

  useEffect(() => {
    const tick = () => {
      const action = rand(ACTIONS);
      setItem({
        id: Date.now(),
        name: rand(NAMES),
        country: rand(COUNTRIES),
        verb: action.verb,
        isJoin: action.isJoin,
        amount: randAmount(),
        shares: Math.floor(Math.random() * 95) + 5,
        model: rand(CAR_MODELS),
        Icon: action.icon,
        type: action.type,
      });
      hideTimeoutRef.current = setTimeout(() => setItem(null), 5000);
    };
    const initial = setTimeout(tick, 2500);
    const interval = setInterval(tick, 8000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  if (!item) return null;
  const Icon = item.Icon;

  return (
    <>
      <style>{`
        @keyframes earnings-slide-up {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        key={item.id}
        className="fixed bottom-20 left-6 z-50"
        style={{ animation: "earnings-slide-up 400ms ease-out both" }}
      >
        <div
          className="relative inline-flex items-center gap-3 rounded-xl shadow-elegant p-3 pr-9 w-fit max-w-[300px]"
          style={{ backgroundColor: "#1BD7C5", color: "#FFFFFF" }}
        >
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#FFFFFF" }}
          >
            <X className="h-3 w-3" />
          </button>

          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#FFFFFF" }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium leading-tight">
            {item.type === "joined" && (
              <>New investor {item.verb} <span className="font-bold">{item.country}</span></>
            )}
            {item.type === "stock" && (
              <>
                {item.name} {item.verb} <span className="font-bold">{item.shares} Tesla shares</span>
              </>
            )}
            {item.type === "car" && (
              <>
                {item.name} {item.verb} a Tesla <span className="font-bold">{item.model}</span>
              </>
            )}
            {(item.type === "earned" || item.type === "withdrew" || item.type === "deposit") && (
              <>
                {item.name} from {item.country} {item.verb}{" "}
                <span className="font-bold" style={{ color: "#FFF508" }}>
                  ${item.amount?.toLocaleString()}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
};
