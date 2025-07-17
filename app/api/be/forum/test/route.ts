// Test route to check backend connection

const BACKEND_URL = process.env.BACKEND_API_URL || "http://localhost:3000";

export async function GET() {
  try {
    const fetchRes = await fetch(`${BACKEND_URL}/forum/stats`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!fetchRes.ok) {
      return new Response(`Backend not responding: ${fetchRes.status}`, {
        status: fetchRes.status,
      });
    }

    const data = await fetchRes.json();
    return Response.json({ 
      status: "Backend connected successfully",
      backendData: data 
    });
  } catch (err) {
    console.error("Backend connection test error:", err);
    return new Response(`Backend connection failed: ${err}`, { status: 500 });
  }
}
