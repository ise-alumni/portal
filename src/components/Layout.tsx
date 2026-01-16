import { ReactNode, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavigate, Link } from "react-router-dom";
import { LogOut  } from "lucide-react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose, DrawerTitle } from "@/components/ui/drawer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  // Redirect to auth page if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-2 border-foreground">
         <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
           <div className="flex justify-center sm:justify-start">
             <Link to="/" className="text-2xl tracking-tight flex items-center gap-2"><img src="/logo.png" alt="ISE Alumni Logo" className="h-8 w-auto" /> ALUMNI</Link>
           </div>
            {/* Mobile/Tablet - Drawer Menu */}
            <div className="lg:hidden flex justify-center sm:justify-end">
              <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="w-60">
                  [menu]
                </Button>
              </DrawerTrigger>
               <DrawerContent className="bg-card border-2 border-foreground rounded-none">
                 <DrawerTitle className="sr-only">Navigation Menu</DrawerTitle>
                 <div className="p-4">
                   <nav className="flex flex-col gap-4 text-sm justify-center items-center">
                     {profile && ['Admin', 'Staff'].includes(profile.user_type) && (
                       <DrawerClose asChild>
                         <Button asChild variant="outline" className="w-full max-w-xs">
                           <Link to="/dashboard">
                             Dashboard
                           </Link>
                         </Button>
                       </DrawerClose>
                     )}
                     <DrawerClose asChild>
                       <Button asChild variant="outline" className="w-full max-w-xs">
                         <Link to="/events">Events</Link>
                       </Button>
                     </DrawerClose>
                     <DrawerClose asChild>
                       <Button asChild variant="outline" className="w-full max-w-xs">
                         <Link to="/map">Map</Link>
                       </Button>
                     </DrawerClose>
                      <DrawerClose asChild>
                        <Button asChild variant="outline" className="w-full max-w-xs">
                          <Link to="/announcements">Announcements</Link>
                        </Button>
                      </DrawerClose>
                     <DrawerClose asChild>
                       <Button asChild variant="outline" className="w-full max-w-xs">
                         <Link to="/directory">Directory</Link>
                       </Button>
                     </DrawerClose>
                   </nav>
                  <div className="flex flex-col gap-4 mt-4 items-center">
                    {!loading && user && (
                      <DrawerClose asChild>
                        <Button variant="outline" size="sm" className="border-foreground hover:bg-foreground hover:text-background w-full max-w-xs" onClick={handleSignOut}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Exit
                        </Button>
                      </DrawerClose>
                    )}
                  </div>
                </div>
              </DrawerContent>
             </Drawer>
            </div>

             {/* Desktop - Inline Navbar */}
             <div className="hidden lg:flex items-center gap-4">
               <nav className="flex items-center gap-4">
                 {profile && ['Admin', 'Staff'].includes(profile.user_type) && (
                   <Button asChild variant="outline">
                     <Link to="/dashboard">
                       Dashboard
                     </Link>
                   </Button>
                 )}
                 <Button asChild variant="outline">
                   <Link to="/events">Events</Link>
                 </Button>
                 <Button asChild variant="outline">
                   <Link to="/map">Map</Link>
                 </Button>
                 <Button asChild variant="outline">
                   <Link to="/announcements">Announcements</Link>
                 </Button>
                 <Button asChild variant="outline">
                   <Link to="/directory">Directory</Link>
                 </Button>
               </nav>
              {!loading && user && (
                <Button variant="outline" size="sm" className="border-foreground hover:bg-foreground hover:text-background" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit
                </Button>
              )}
             </div>
          </div>
      </header>

      <main className="container mx-auto px-4 py-10 flex-1">
        {!loading && user && profile && children}
      </main>

      <footer className="border-t-2 border-foreground">
        <div className="container mx-auto px-4 py-4 text-xs flex justify-between">
          <span>© {new Date().getFullYear()} ISE Alumni</span>
          <span className="opacity-70">By alumni, for alumni.</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;


