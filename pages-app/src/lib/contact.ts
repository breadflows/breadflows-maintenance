export function enquiryMailto(data: Record<string, unknown>) {
  const fields = [
    ["Name", "name"],
    ["Reply email", "email"],
    ["Track", "track"],
    ["Idea", "brief"],
    ["Budget", "budget"],
    ["Timeline", "deadline"],
    ["References", "references"],
  ];
  const body = fields
    .map(([label, key]) => label + ": " + String(data[key] || "").slice(0, 5000))
    .join("\n\n");
  return (
    "mailto:contact@breadflows.com?subject=" +
    encodeURIComponent("Music video enquiry") +
    "&body=" +
    encodeURIComponent(body)
  );
}
