export const enquiryEndpoint = "https://formsubmit.co/ajax/contact@breadflows.com";
export function enquiryPayload(data: Record<string, unknown>) {
  const text = (key: string, limit: number) =>
    String(data[key] || "")
      .trim()
      .slice(0, limit);
  return {
    name: text("name", 100),
    email: text("email", 254),
    "Track link": text("track", 2000),
    "What do you have in mind?": text("brief", 5000),
    Budget: text("budget", 100),
    Timeline: text("deadline", 100),
    References: text("references", 2000),
    _honey: text("website", 200),
    _subject: "BreadFlows — commission / collaboration enquiry",
    _template: "table",
  };
}
export async function sendEnquiry(data: Record<string, unknown>, request: typeof fetch = fetch) {
  const payload = enquiryPayload(data);
  if (!payload.name || !payload.email || !payload["What do you have in mind?"] || payload._honey) {
    throw new Error("Please fill in your name, email and idea before sending.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await request(enquiryEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await response.json();
    if (/activat|confirm.{0,40}email|check.{0,40}email/i.test(String(result?.message || ""))) {
      throw new Error(
        "This form is awaiting email activation. Please email contact@breadflows.com directly for now. Your details are still here.",
      );
    }
    if (!response.ok || (result?.success !== true && result?.success !== "true")) {
      throw new Error(
        "The enquiry could not be submitted. Your details are still here. Please try again or email contact@breadflows.com directly.",
      );
    }
  } catch (error) {
    if (error instanceof Error && /^(This form|The enquiry)/.test(error.message)) throw error;
    throw new Error(
      "We couldn't confirm your submission. Your details are still here. Please try again or email contact@breadflows.com directly.",
    );
  } finally {
    clearTimeout(timer);
  }
}
