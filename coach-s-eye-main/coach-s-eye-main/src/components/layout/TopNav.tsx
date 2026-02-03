import { Gamepad2 } from "lucide-react";

const TopNav = () => {
  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary">
            <Gamepad2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight gradient-text">
              AI Assistant Coach
            </h1>
            <p className="text-xs text-muted-foreground">
              Performance Insights for Esports Teams
            </p>
          </div>
        </div>

        {/* Right side - could add user menu, notifications, etc. */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">Live Analysis</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Cloud9 × JetBrains Hackathon
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
