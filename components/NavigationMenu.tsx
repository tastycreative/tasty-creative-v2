import { handleLogout } from "@/app/actions/sign-out";
import Link from "next/link";
import React from "react";

const NavigationMenu = ({
  scrollToSection,
  heroRef,
  aboutRef,
  servicesRef,
  workRef,
  contactRef,
  setMenuOpen,
  menuOpen,
  session,
}: NavigationMenuProps) => {
  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 z-40 bg-black/30 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          {/* Logo on the left */}
          <div className="absolute left-6">
            <h1 className="text-2xl select-none font-bold bg-gradient-to-b from-indigo-950 via-purple-500 to-black bg-clip-text text-transparent">
              Tasty Creative
            </h1>
          </div>

          {/* Centered Desktop Menu */}
          <ul className="hidden md:flex space-x-8">
            <li>
              <button
                onClick={() => scrollToSection(heroRef)}
                className="hover:text-indigo-400 transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="hover:text-indigo-400 transition-colors"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(servicesRef)}
                className="hover:text-indigo-400 transition-colors"
              >
                Services
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(workRef)}
                className="hover:text-indigo-400 transition-colors"
              >
                Work
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(contactRef)}
                className="hover:text-indigo-400 transition-colors"
              >
                Contact
              </button>
            </li>
          </ul>

          {/* Mobile Menu Button on the right */}
          <div className="absolute right-6 md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative w-8 h-8 flex flex-col justify-center items-center"
            >
              <span
                className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? "rotate-45 translate-y-1" : ""}`}
              />
              <span
                className={`w-6 h-0.5 bg-white my-1 transition-all ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden absolute top-full left-0 w-full bg-black/90 backdrop-blur-md transition-all duration-300 ${
            menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        >
          <ul className="p-6 space-y-4">
            <li>
              <button
                onClick={() => scrollToSection(heroRef)}
                className="block w-full text-left hover:text-indigo-400 transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(aboutRef)}
                className="block w-full text-left hover:text-indigo-400 transition-colors"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(servicesRef)}
                className="block w-full text-left hover:text-indigo-400 transition-colors"
              >
                Services
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(workRef)}
                className="block w-full text-left hover:text-indigo-400 transition-colors"
              >
                Work
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection(contactRef)}
                className="block w-full text-left hover:text-indigo-400 transition-colors"
              >
                Contact
              </button>
            </li>
          </ul>
          <hr className="mx-6" />
          <div className=" p-6">
            {session ? (
              <form className="flex flex-col gap-2" action={handleLogout}>
                <p className="text-gray-600 dark:text-gray-400">
                  {session.user.name || "Not set"}
                </p>
                {session.user.role !== "GUEST" && (
                  <Link
                    href="/dashboard"
                    className="text-purple-500 hover:underline"
                  >
                    Dashboard
                  </Link>
                )}
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin/users"
                    className="text-purple-500 hover:underline"
                  >
                    Admin
                  </Link>
                )}
                <button className="cursor-pointer text-start" type="submit">
                  Sign Out
                </button>
              </form>
            ) : (
              <div>
                <Link
                  href="/sign-in"
                  className="text-purple-500 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default NavigationMenu;
