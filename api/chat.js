export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    /* 1️⃣ WALIDACJA */
    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "Nie otrzymałem wiadomości." });
    }

    if (message.length > 300) {
      return res.status(400).json({
        reply: "Wiadomość jest za długa. Spróbuj krócej 🙂"
      });
    }

    /* 2️⃣ PROSTA FILTRACJA WULGARYZMÓW */
    const vulgar = ["kurwa", "chuj", "pierd", "sra", "gówno", "jeb"];
    if (vulgar.some(v => message.toLowerCase().includes(v))) {
      return res.status(200).json({
        reply:
          "Rozumiem emocje 🙂 Spróbuj opisać sytuację trochę spokojniej, a postaram się pomóc."
      });
    }

    /* 3️⃣ OPENAI */
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
                "Jesteś pomocnym, rzeczowym asystentem AI. Odpowiadasz spokojnie i konkretnie."
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
      return res.status(200).json({
        reply:
          "Nie mogę na to teraz odpowiedzieć, ale jeśli sformułujesz pytanie inaczej – spróbujmy ponownie 🙂"
      });
    }

    return res.status(200).json({
      reply: data.choices[0].message.content
    });

  } catch (error) {
    return res.status(200).json({
      reply: "Wystąpił błąd techniczny. Spróbuj za chwilę."
    });
  }
}
