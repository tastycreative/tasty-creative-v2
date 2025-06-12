
import { useRouter } from "next/router";

export function HandleBack() {
  const router = useRouter();
  router.push("/apps");
}
