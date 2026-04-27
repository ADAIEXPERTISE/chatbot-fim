export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const res = await fetch(process.env.NEXT_PUBLIC_N8N_PRODUCTION_URL!, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    return Response.json(data);
  } catch (error) {
    return Response.json({ reply: "Server error" }, { status: 500 });
  }
}
