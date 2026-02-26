import { getSession } from "@/lib/auth";
import { LandingPageContent } from "@/components/LandingPageContent";

export default async function LandingPage() {
  const session = await getSession();
  const isLoggedIn = !!session;

  return <LandingPageContent isLoggedIn={isLoggedIn} />;
}
