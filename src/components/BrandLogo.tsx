import logo from "@/assets/tesla-wordmark.png";

export const BrandLogo = ({ className = "" }: { className?: string }) => (
  <img
    src={logo}
    alt="Tesla"
    className={`h-4 w-auto ${className}`}
  />
);

export default BrandLogo;
