/** Confirm the booking application shell, rather than a 200 checkpoint page.
 * The form loads client-side; rendering/submission needs a separate browser check.
 */
export async function isBookingPageHealthy(response: Response): Promise<boolean> {
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return false;
  return (await response.text()).includes('data-booking-page="true"');
}
