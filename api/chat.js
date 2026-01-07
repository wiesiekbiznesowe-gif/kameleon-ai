export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    /* 1️⃣ PODSTAWOWA WALIDACJA */
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Brak wiadomości" });
    }

    /* 2️⃣ LIMIT DŁUGOŚCI (ANTI-SPAM / ANTI-KOSZT) */
    if (message.length > 300) {
      return res.status(400).json({
        error: "Wiadomość jest za długa (max 300 znaków)"
      });
    }

    /* 3️⃣ PROSTE BLOKADY SPAMU */
    const forbidden = ["http://", "https://", "<script", "SELECT *"];
    if (forbidden.some(f => message.toLowerCase().includes(f))) {
      return res.status(400).json({
        error: "Niedozwolona treść"
      });
    }

    /* 4️⃣ WYWOŁANIE OPENAI */
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
                "Jesteś inteligentnym, rzeczowym asystentem AI. Odpowiadasz naturalnie, bez poprawiania pisowni użytkownika."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Brak odpowiedzi AI" });
    }

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
