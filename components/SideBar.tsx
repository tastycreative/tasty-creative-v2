import getSession from "@/app/actions/get-session";
import AccountMenu from "./AccountMenu";
import SideMenu from "./SideMenu";
import Logo from "./Logo";

const SideBar = async () => {
  const session = await getSession();

  return (
    <div className="w-72 fixed left-4 top-4 bottom-4 z-20">
      <div className="h-full rounded-2xl backdrop-blur-[2px] shadow-lg border border-white/60 p-6 flex flex-col">
        <Logo />
        <AccountMenu session={session} />
        <SideMenu />
      </div>
    </div>
  );
};

export default SideBar;
