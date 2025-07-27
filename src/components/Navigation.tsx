import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe, Settings } from "lucide-react";

const Navigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold">
            <Globe className="h-5 w-5" />
            STARNET
          </Link>
          
          <div className="flex gap-2">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/">Packages</Link>
            </Button>
            
            <Button
              variant={location.pathname === "/admin" ? "default" : "ghost"}
              size="sm"
              asChild
            >
              <Link to="/admin">
                <Settings className="h-4 w-4 mr-1" />
                Admin
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;