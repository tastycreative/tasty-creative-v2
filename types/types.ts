/* eslint-disable @typescript-eslint/no-unused-vars */
type AuthResponse = {
  error?: string;
  success?: boolean;
};

type User = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
};

type Role = "USER" | "GUEST" | "ADMIN" | "MODERATOR";

interface UserRoleFormProps {
  userId: string;
  currentRole: Role;
  userName: string;
  isCurrentUser: boolean;
}

interface NavigationMenuProps {
  scrollToSection: (ref: React.RefObject<HTMLDivElement>) => void;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  heroRef: React.RefObject<HTMLDivElement>;
  aboutRef: React.RefObject<HTMLDivElement>;
  servicesRef: React.RefObject<HTMLDivElement>;
  workRef: React.RefObject<HTMLDivElement>;
  contactRef: React.RefObject<HTMLDivElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}
