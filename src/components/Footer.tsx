const Footer = () => (
  <footer className="pt-24 pb-10 border-t border-border bg-surface/30">
    <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
      <div className="grid md:grid-cols-12 gap-10 mb-16">
        <div className="md:col-span-5">
          <img src="/tesla-icon.png" alt="Tesla" className="h-10 w-auto mb-4" />
          <p className="text-sm text-foreground/55 max-w-sm leading-relaxed font-light">
            A platform where digital wealth meets electric mobility. Earn, grow, and drive the future.
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="label-mono text-foreground/40 mb-4">Quick Links</p>
          <ul className="space-y-2.5 text-[13px] text-foreground/70">
            <li><a href="#" className="hover:text-foreground transition-colors">Home</a></li>
            <li><a href="#inventory" className="hover:text-foreground transition-colors">Inventory</a></li>
            <li><a href="#about" className="hover:text-foreground transition-colors">About Us</a></li>
            <li><a href="#services" className="hover:text-foreground transition-colors">Services</a></li>
            <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="label-mono text-foreground/40 mb-4">Platform</p>
          <ul className="space-y-2.5 text-[13px] text-foreground/70">
            <li><a href="#inventory" className="hover:text-foreground transition-colors">Vehicles</a></li>
            <li><a href="#plans" className="hover:text-foreground transition-colors">Plans</a></li>
            <li><a href="#leaderboard" className="hover:text-foreground transition-colors">Traders</a></li>
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="label-mono text-foreground/40 mb-4">Legal</p>
          <ul className="space-y-2.5 text-[13px] text-foreground/70">
            <li><a href="#terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</a></li>
            <li><a href="#privacy" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div className="text-[11px] text-foreground/40 font-mono border-t border-border pt-6 flex justify-between flex-wrap gap-2">
        <span>© {new Date().getFullYear()} TESLA. ALL RIGHTS RESERVED.</span>
        <span>BUILT FOR THE FUTURE OF MOBILITY &amp; MONEY.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
