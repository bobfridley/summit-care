// src/pages/Layout.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Mountain,
  Pill,
  Database,
  FileText,
  Home,
  Bot as BotIcon,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import { AnimatePresence, motion } from "framer-motion";

// If you wired useScrollRestoration earlier, you can import and use it.
// import { useScrollRestoration } from "@/hooks/useScrollRestoration";

const allNavigationItems = [
  { title: "Overview", url: createPageUrl("dashboard"), icon: Home, adminOnly: false },
  { title: "My Climbs", url: createPageUrl("climbs"), icon: Mountain, adminOnly: false },
  { title: "My Medications", url: createPageUrl("medications"), icon: Pill, adminOnly: false },
  { title: "Medication Database", url: createPageUrl("database"), icon: Database, adminOnly: false },
  { title: "Trip Reports", url: createPageUrl("reports"), icon: FileText, adminOnly: false },
  {
    title: "Summit Assistant",
    url: createPageUrl("summit-assistant"),
    icon: MessageSquare,
    adminOnly: false,
    featured: true,
  },
  { title: "AI Assistant", url: createPageUrl("ai-playground"), icon: BotIcon, adminOnly: true },
  {
    title: "Disclaimer",
    url: createPageUrl("disclaimer"),
    icon: AlertTriangle,
    variant: "danger",
    adminOnly: false,
  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const mainScrollRef = useRef(null);

  // Close sidebar on navigation (mobile toggle state)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Load Inter font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    return () => {
      const existingLink = document.querySelector(`link[href='${link.href}']`);
      if (existingLink) document.head.removeChild(existingLink);
    };
  }, []);

  // One-time mountain intro overlay
  useEffect(() => {
    const t = setTimeout(() => setShowIntro(false), 900);
    return () => clearTimeout(t);
  }, []);

  // If you implemented scroll restoration earlier, you can re-enable this:
  // useScrollRestoration(mainScrollRef);

  const navigationItems = allNavigationItems.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* Mountain fade-in intro overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1b2835] via-[#223b4a] to-[#2D5016]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="w-16 h-16 mountain-gradient rounded-2xl flex items-center justify-center shadow-xl">
                <Mountain className="w-9 h-9 text-white" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-200/80">
                  SummitCare
                </p>
                <p className="text-lg font-semibold text-slate-50 mt-1">
                  Altitude Medication Tracker
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="min-h-screen flex w-full">
          <style>{`
            :root {
              --primary-green: #2D5016;
              --secondary-green: #4A7C59;
              --primary-blue: #4A6FA5;
              --secondary-blue: #6B8CAE;
              --accent-green: #8FBC8F;
              --neutral-warm: #F7F6F4;
              --text-primary: #1A1A1A;
              --text-secondary: #4A4A4A;
              --font-inter: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            * { font-family: var(--font-inter); font-feature-settings: 'cv02','cv03','cv04','cv11'; }
            .mountain-gradient {
              background: linear-gradient(
                135deg,
                var(--primary-green) 0%,
                var(--secondary-green) 50%,
                var(--primary-blue) 100%
              );
            }
            .alpine-card {
              background: rgba(255,255,255,0.95);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(75,111,165,0.1);
            }
            .mountain-page {
              background-image:
                radial-gradient(circle at 0 0, rgba(74,111,165,0.09), transparent 60%),
                linear-gradient(to bottom, rgba(45,80,22,0.08), transparent 45%);
              background-color: var(--neutral-warm);
            }
          `}</style>

          {/* Fixed sidebar */}
          <Sidebar
            collapsible="none"
            variant="inset"
            className="fixed inset-y-0 left-0 w-64 border-r border-stone-200 bg-white z-30"
          >
            <SidebarHeader className="border-b border-stone-200 p-6">
              <Link
                to={createPageUrl("dashboard")}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
              >
                <div className="w-10 h-10 mountain-gradient rounded-lg flex items-center justify-center shadow-sm">
                  <Mountain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-lg text-text-primary">SummitCare</h2>
                  <p className="text-xs text-text-secondary font-medium">
                    Altitude Medication Tracker
                    {isAdmin && (
                      <span className="ml-2 text-primary-blue font-semibold">• Admin</span>
                    )}
                  </p>
                </div>
              </Link>
            </SidebarHeader>

            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-text-secondary uppercase tracking-wider px-3 py-2">
                  Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      const danger = item.variant === "danger";
                      const featured = item.featured;

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            className={`relative transition-all duration-300 rounded-xl mb-1 font-medium
                              ${
                                danger
                                  ? "hover:bg-red-50 hover:text-red-600 text-red-600"
                                  : "hover:bg-green-50 hover:text-green-800"
                              }
                              ${
                                featured && !isActive
                                  ? "bg-primary-blue/10 text-primary-blue border border-primary-blue/30"
                                  : ""
                              }
                              ${
                                isActive
                                  ? danger
                                    ? "bg-red-600 text-white shadow-sm font-semibold"
                                    : "bg-green-800 text-white shadow-sm font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1.5 before:rounded-full before:bg-primary-blue"
                                  : ""
                              }
                            `}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                              <item.icon className="w-5 h-5" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          {/* Main content area (shifted right by sidebar width) */}
          <SidebarInset className="flex flex-col mountain-page ml-64">
            {/* Mobile header with sidebar trigger */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4 md:hidden">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-stone-100 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-text-primary">SummitCare</h1>
              </div>
            </header>

            <div ref={mainScrollRef} className="flex-1 overflow-auto">
              {/* Per-route animated page content */}
              <PageTransition>{children}</PageTransition>
            </div>
          </SidebarInset>

          {/* Floating AI button for admins */}
          {isAdmin && (
            <Link to={createPageUrl("ai-playground")} className="fixed bottom-5 right-5 z-50">
              <Button className="mountain-gradient hover:opacity-90 transition-opacity shadow-xl rounded-full px-4 py-2 flex items-center gap-2">
                <BotIcon className="w-4 h-4 text-white" />
                <span className="hidden sm:inline text-white font-semibold">AI Assistant</span>
              </Button>
            </Link>
          )}
        </div>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </>
  );
}
