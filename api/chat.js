export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Brak wiadomości od użytkownika" });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "Jesteś inteligentnym, rzeczowym asystentem. Odpowiadasz normalnie, logicznie i konkretnie. " +
              "Nie moralizujesz, nie pouczasz, nie poprawiasz pisowni użytkownika. " +
              "Jeśli pytanie jest chaotyczne lub emocjonalne – próbujesz zrozumieć sens i pomóc."
          },
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return res.status(500).json({
        error: "Błąd OpenAI",
        details: errText
      });
    }

    const data = await openaiResponse.json();

    if (
      !data ||
      !data.choices ||
      !data.choices[0] ||
      !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      return res.status(500).json({
        error: "Pusta odpowiedź AI"
      });
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
