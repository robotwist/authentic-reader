/** Posts to Netlify Forms; static copies of the forms live in index.html. */
export async function submitNetlifyForm(formName: string, fields: Record<string, string>) {
  const body = new URLSearchParams({ 'form-name': formName, ...fields });
  const response = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  if (!response.ok) throw new Error(`Form submission failed: ${response.status}`);
}
