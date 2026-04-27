import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft } from "lucide-react";

const Forbidden = () => (
  <div className="min-h-screen bg-hero flex items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] blob opacity-30 pointer-events-none" />
    <div className="w-full max-w-md text-center relative">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
        <ShieldOff className="w-8 h-8 text-destructive" />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Error 403</p>
      <h1 className="font-display text-4xl font-light mb-3">Access denied</h1>
      <p className="text-sm text-muted-foreground mb-8">
        You don't have permission to view this area. If you believe this is a mistake,
        contact support.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to dashboard</Link>
        </Button>
        <Button asChild className="rounded-full shadow-elegant">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default Forbidden;
