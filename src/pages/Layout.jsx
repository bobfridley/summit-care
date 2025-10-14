

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mountain, Pill, Database, FileText, Home, Bot as BotIcon, Image as ImageIcon, AlertTriangle } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import DemoDisclaimer from "@/components/common/DemoDisclaimer";

const navigationItems = [
  {
    title: "Overview",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "My Climbs",
    url: createPageUrl("Climbs"),
    icon: Mountain,
  },
  {
    title: "My Medications",
    url: createPageUrl("Medications"),
    icon: Pill,
  },
  {
    title: "Medication Database",
    url: createPageUrl("Database"),
    icon: Database,
  },
  {
    title: "Trip Reports",
    url: createPageUrl("Reports"),
    icon: FileText,
  },
  {
    title: "AI Assistant",
    url: createPageUrl("AIPlayground"),
    icon: BotIcon,
  },
  {
    title: "Brand Assets",
    url: createPageUrl("BrandAssets"),
    icon: ImageIcon,
  },
  {
    title: "DB Access Helper",
    url: createPageUrl("DBAccessHelp"),
    icon: Database,
  },
  // Added: MySQL Schema page
  {
    title: "MySQL Schema",
    url: createPageUrl("MySQLSchema"),
    icon: FileText,
  },
  // Added: MySQL Sample Data page
  {
    title: "MySQL Sample Data",
    url: createPageUrl("MySQLSampleData"),
    icon: FileText,
  },
  // Add: Disclaimer link (red)
  {
    title: "Disclaimer",
    url: createPageUrl("Disclaimer"),
    icon: AlertTriangle,
    variant: "danger"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Cleanup function
    return () => {
      const existingLink = document.querySelector(`link[href="${link.href}"]`);
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
    };
  }, []);

  // Determine whether to show the full disclaimer at the top
  const medicationPages = new Set(["Medications", "Database"]);
  const showDisclaimer = medicationPages.has(currentPageName);

  return (
    <SidebarProvider>
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
          
          * {
            font-family: var(--font-inter);
            font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
          }
          
          .mountain-gradient {
            background: linear-gradient(135deg, var(--primary-green) 0%, var(--secondary-green) 50%, var(--primary-blue) 100%);
          }
          
          .alpine-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(75, 111, 165, 0.1);
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: 700;
            letter-spacing: -0.025em;
          }
          
          .font-display {
            font-weight: 800;
            letter-spacing: -0.05em;
          }
        `}</style>
        <Sidebar className="border-r border-stone-200 bg-neutral-warm">
          <SidebarHeader className="border-b border-stone-200 p-6">
            <Link 
              to={createPageUrl("Dashboard")} 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 mountain-gradient rounded-lg flex items-center justify-center shadow-sm">
                <Mountain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-display text-lg text-text-primary">SummitCare</h2>
                <p className="text-xs text-text-secondary font-medium">Altitude Medication Tracker</p>
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
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`transition-all duration-300 rounded-xl mb-1 font-medium
                            ${danger ? 'hover:bg-red-50 hover:text-red-600 text-red-600' : 'hover:bg-accent-green/20 hover:text-primary-green'}
                            ${isActive ? (danger ? 'bg-red-600 text-white shadow-sm font-semibold' : 'bg-primary-green text-white shadow-sm font-semibold') : ''}
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

            <div className="mt-8 px-3">
              <div className="alpine-card rounded-xl p-4 shadow-sm">
                <div className="text-center">
                  <Mountain className="w-8 h-8 text-primary-blue mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-text-primary mb-1">Your Journey Matters</h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    Track your climbs and medications with SummitCare.
                  </p>
                </div>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-neutral-warm">
          <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-stone-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-text-primary">SummitCare</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {showDisclaimer && (
              <div className="px-4 md:px-6 pt-4">
                <DemoDisclaimer />
              </div>
            )}
            {children}
          </div>
        </main>

        {/* Global floating AI Assistant button */}
        <Link to={createPageUrl("AIPlayground")} className="fixed bottom-5 right-5 z-50">
          <Button className="mountain-gradient hover:opacity-90 transition-opacity shadow-xl rounded-full px-4 py-2 flex items-center gap-2">
            <BotIcon className="w-4 h-4 text-white" />
            <span className="hidden sm:inline text-white font-semibold">AI Assistant</span>
          </Button>
        </Link>
      </div>
    </SidebarProvider>
  );
}

