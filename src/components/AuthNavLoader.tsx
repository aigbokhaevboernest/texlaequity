import { useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./Loader";

const LOOP_MS = 1500;
const LOOPS = 2;

export default function AuthNavLoader({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      navigate(to);
    }, LOOP_MS * LOOPS);
  };

  return (
    <>
      <a href={to} onClick={handleClick} className={className}>
        {children}
      </a>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95">
          <Loader />
        </div>
      )}
    </>
  );
}
