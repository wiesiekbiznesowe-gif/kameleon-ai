export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Brak wiadomości" });
    }

    const messages = [
      {
        role: "system",
        content:
          "Jesteś inteligentnym, konkretnym asystentem AI. " +
          "Pamiętasz kontekst rozmowy. " +
          "Jeśli użytkownik pyta 'gdzie go obejrzę', odnosisz się do ostatniego omawianego filmu. " +
          "Nie pytasz w kółko o gatunek, jeśli już padł. " +
          "Odpowiadasz naturalnie, po ludzku, po polsku."
      },
      ...(Array.isArray(history) ? history : []),
      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Brak odpowiedzi AI" });
    }

    return res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    return res.status(500).json({
      error: "Błąd serwera",
      details: err.message
    });
  }
}
