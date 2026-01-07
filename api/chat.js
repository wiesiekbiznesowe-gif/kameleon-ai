export default async function handler(req, res) {
  // Tylko POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    // Walidacja wejścia
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Brak wiadomości" });
    }

    // Wywołanie OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Jesteś inteligentnym, rzeczowym asystentem AI. Odpowiadasz logicznie, pełnymi zdaniami i spójną całością. Rozumiesz sens wypowiedzi nawet jeśli użytkownik popełnia błędy językowe. NIE poprawiasz pisowni użytkownika, tylko realnie odpowiadasz na jego pytania."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    // Obsługa błędów OpenAI
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        error: "Błąd OpenAI API",
        details: errorText
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: "Brak odpowiedzi AI" });
    }

    // Odpowiedź do frontendu
    return res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    return res.status(500).json({
      error: "Błąd serwera",
      details: error.message
    });
  }
}
