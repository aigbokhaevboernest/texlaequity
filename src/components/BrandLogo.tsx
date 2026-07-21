import logo from "@/assets/tesla-wordmark.png";

export const BrandLogo = ({ className = "" }: { className?: string }) => (
  <img
    src={logo}
    alt="Tesla"
    className={className}
  />
);

export default BrandLogo;
