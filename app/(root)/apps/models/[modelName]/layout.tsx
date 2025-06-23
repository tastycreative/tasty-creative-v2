import { ReactNode } from "react";

interface ModelAppLayoutProps {
  children: ReactNode;
}

export default function ModelAppLayout({ children }: ModelAppLayoutProps) {
  return <div className="">{children}</div>;
}
