// @ts-nocheck
/**
 * This page is the root ("/") route of the SummitCare app.
 * It performs a server-side redirect to the main dashboard.
 * No React Router or client navigation logic needed.
 */

export default function Home() {
  // This component never actually renders on the client,
  // since the redirect happens server-side.
  return null;
}

// Next.js built-in redirect (server-side)
// Redirects "/" → "/dashboard"
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: false, // use true only if this redirect will never change
    },
  };
}
