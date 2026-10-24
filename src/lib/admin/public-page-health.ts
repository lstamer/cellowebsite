/** Confirm the booking UI was served, rather than a 200 status checkpoint page. */
export async function isBookingPageHealthy(response: Response): Promise<boolean> {
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return false;
  return (await response.text()).includes('data-booking-flow="true"');
}
