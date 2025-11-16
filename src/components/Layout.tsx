import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from "@/components/ui/drawer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-foreground">
         <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
           <div className="flex justify-center sm:justify-start">
             <Link to="/" className="text-2xl tracking-tight flex items-center gap-2"><img src="/logo.png" alt="ISE Alumni Logo" className="h-8 w-auto" /> ALUMNI</Link>
           </div>
           <div className="flex justify-center sm:justify-end">
             <Drawer>
             <DrawerTrigger asChild>
               <Button variant="outline" size="sm" className="w-60">
                 [menu]
               </Button>
             </DrawerTrigger>
             <DrawerContent className="bg-card border-border">
               <div className="p-4">
                 <nav className="flex flex-col gap-4 text-sm justify-center items-center">
                   <DrawerClose asChild>
                     <Button asChild variant="outline" className="w-full max-w-xs bg-[#0C314C] text-white hover:bg-[#0C314C]/80">
                       <Link to="/events">Events</Link>
                     </Button>
                   </DrawerClose>
                   <DrawerClose asChild>
                     <Button asChild variant="outline" className="w-full max-w-xs bg-[#1BA165] text-white hover:bg-[#1BA165]/80">
                       <Link to="/map">Map</Link>
                     </Button>
                   </DrawerClose>
                    <DrawerClose asChild>
                      <Button asChild variant="outline" className="w-full max-w-xs bg-[#126E56] text-white hover:bg-[#126E56]/80">
                        <Link to="/announcements">Announcements</Link>
                      </Button>
                    </DrawerClose>
                   <DrawerClose asChild>
                     <Button asChild variant="outline" className="w-full max-w-xs bg-[#0C314C] text-white hover:bg-[#0C314C]/80">
                       <Link to="/directory">Directory</Link>
                     </Button>
                   </DrawerClose>
                 </nav>
                 <div className="flex flex-col gap-4 mt-4 items-center">
                   {!loading && user && <span className="text-xs uppercase">Signed in</span>}
                   {!loading && user && (
                     <DrawerClose asChild>
                       <Button variant="outline" size="sm" className="border-foreground hover:bg-foreground hover:text-background w-60" onClick={handleSignOut}>
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
         </div>
      </header>

      <main className="container mx-auto px-4 py-10 flex-1">
        {children}
      </main>

      <footer className="border-t border-foreground">
        <div className="container mx-auto px-4 py-4 text-xs flex justify-between">
          <span>© {new Date().getFullYear()} ISE Alumni</span>
          <span className="opacity-70">By alumni, for alumni.</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;


