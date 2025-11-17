/**
 * Catch-all route for .well-known URLs
 * Prevents Chrome DevTools noise in console
 */
export function loader() {
  return new Response(null, { status: 204 });
}

export default function WellKnown() {
  return null;
}
