import React, { useState } from 'react';
import { ChevronLeft, Code, Palette, FileText, Settings, Database, Cloud, Shield, Zap } from 'lucide-react';

const AppsNavigation = () => {
  const [hoveredItem, setHoveredItem] = useState(null);
  
  const appPages = [
    { 
      id: 1, 
      name: 'Code Editor', 
      path: '/apps/code-editor', 
      icon: Code, 
      color: 'from-blue-500 to-cyan-500',
      size: 'col-span-2 row-span-2',
      description: 'Advanced code editing tools'
    },
    { 
      id: 2, 
      name: 'Design Studio', 
      path: '/apps/design-studio', 
      icon: Palette, 
      color: 'from-purple-500 to-pink-500',
      size: 'col-span-3 row-span-1',
      description: 'Creative design workspace'
    },
    { 
      id: 3, 
      name: 'Document Manager', 
      path: '/apps/documents', 
      icon: FileText, 
      color: 'from-green-500 to-emerald-500',
      size: 'col-span-2 row-span-1',
      description: 'Organize your files'
    },
    { 
      id: 4, 
      name: 'Settings', 
      path: '/apps/settings', 
      icon: Settings, 
      color: 'from-gray-500 to-slate-500',
      size: 'col-span-1 row-span-1',
      description: 'App configuration'
    },
    { 
      id: 5, 
      name: 'Database', 
      path: '/apps/database', 
      icon: Database, 
      color: 'from-orange-500 to-red-500',
      size: 'col-span-2 row-span-2',
      description: 'Data management system'
    },
    { 
      id: 6, 
      name: 'Cloud Storage', 
      path: '/apps/cloud', 
      icon: Cloud, 
      color: 'from-sky-500 to-blue-500',
      size: 'col-span-2 row-span-1',
      description: 'Cloud file storage'
    },
    { 
      id: 7, 
      name: 'Security', 
      path: '/apps/security', 
      icon: Shield, 
      color: 'from-indigo-500 to-purple-500',
      size: 'col-span-1 row-span-2',
      description: 'Security settings'
    },
    { 
      id: 8, 
      name: 'Automation', 
      path: '/apps/automation', 
      icon: Zap, 
      color: 'from-yellow-500 to-amber-500',
      size: 'col-span-2 row-span-1',
      description: 'Workflow automation'
    }
  ];

  const handleNavigation = (path) => {
    // For Next.js, you would use router.push(path)
    // import { useRouter } from 'next/navigation';
    // const router = useRouter();
    // router.push(path);
    
    console.log(`Navigating to: ${path}`);
  };

  return (
    <div className="w-full h-full">
      {/* Back Button */}
      <button 
        onClick={() => handleNavigation('/dashboard')}
        className="group mb-6 flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
      >
        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        <span className="font-medium">Back to Dashboard</span>
      </button>

      {/* Grid Navigation */}
      <div className="grid grid-cols-6 grid-rows-4 gap-4 h-[calc(100%-4rem)] auto-rows-fr">
        {appPages.map((app) => {
          const Icon = app.icon;
          const isHovered = hoveredItem === app.id;
          
          return (
            <button
              key={app.id}
              className={`${app.size} relative group overflow-hidden rounded-2xl transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl`}
              onMouseEnter={() => setHoveredItem(app.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={() => handleNavigation(app.path)}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
              
              {/* Animated Glow Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${app.color} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
              
              {/* Glass Effect Overlay */}
              <div className="absolute inset-0 bg-white/10 dark:bg-black/10 backdrop-blur-sm" />
              
              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-colors duration-300" />
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-white">
                <Icon className={`mb-3 transition-all duration-500 ${
                  isHovered ? 'w-12 h-12' : 'w-10 h-10'
                }`} />
                
                <h3 className="font-bold text-lg lg:text-xl mb-2 transition-all duration-300">
                  {app.name}
                </h3>
                
                <p className={`text-sm text-white/80 text-center transition-all duration-500 ${
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  {app.description}
                </p>
              </div>
              
              {/* Hover Animation Effects */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-x-16 -translate-y-16 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-x-20 translate-y-20 animate-pulse delay-300" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppsNavigation;