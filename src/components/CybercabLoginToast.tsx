import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";

export default function CybercabLoginToast() {
  const nav = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("cybercab_toast_shown")) return;
    const t = setTimeout(() => {
      sessionStorage.setItem("cybercab_toast_shown", "1");
      toast(
        <div className="flex items-center gap-3">
          <Rocket className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-[13px]">Cybercab Investment is live</p>
            <p className="text-[11px] text-muted-foreground">Get in early on Tesla's autonomous fleet.</p>
          </div>
          <button
            onClick={() => nav("/dashboard/cybercab")}
            className="text-[12px] font-medium text-primary shrink-0"
          >
            Explore
          </button>
        </div>,
        { duration: 9000 }
      );
    }, 3500);
    return () => clearTimeout(t);
  }, [nav]);

  return null;
}
