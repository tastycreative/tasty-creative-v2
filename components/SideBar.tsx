import getSession from "@/app/actions/get-session";
import AccountMenu from "./AccountMenu";
import SideMenu from "./SideMenu";
import Logo from "./Logo";

const SideBar = async () => {
  const session = await getSession();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 fixed left-4 top-4 bottom-4 z-20">
        <div className="h-full rounded-2xl backdrop-blur-[2px] shadow-lg border border-white/60 p-6 flex flex-col">
          <Logo />
          <AccountMenu session={session} />
          <SideMenu />
        </div>
      </div>

      {/* Mobile/Tablet Sidebar */}
      <div className="lg:hidden">
        <input type="checkbox" id="sidebar-toggle" className="peer hidden" />
        
        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <Logo />
            <label
              htmlFor="sidebar-toggle"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <div className="fixed inset-0 bg-black/50 z-40 hidden peer-checked:block lg:hidden" />
        
        {/* Mobile Sidebar Panel */}
        <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 z-50 transform -translate-x-full peer-checked:translate-x-0 transition-transform duration-300 ease-in-out lg:hidden">
          <div className="h-full p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <Logo />
              <label
                htmlFor="sidebar-toggle"
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </label>
            </div>
            <AccountMenu session={session} />
            <SideMenu />
          </div>
        </div>
      </div>
    </>
  );
};

export default SideBar;