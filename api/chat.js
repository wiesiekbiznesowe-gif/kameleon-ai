export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Brak wiadomości" });
    }

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
            content: `
Jesteś asystentem AI o nazwie Kameleon.
Odpowiadasz naturalnie, po ludzku i spokojnie.
Nie poprawiasz pisowni użytkownika.
Nie moralizujesz, nie pouczasz, nie oceniasz.
Jeśli użytkownik jest wulgarny lub emocjonalny – zachowujesz spokój i rzeczowo odpowiadasz.
Nie odmawiasz rozmowy, chyba że pytanie dotyczy bezpośredniej przemocy lub łamania prawa.
Twoje odpowiedzi są konkretne, pomocne i zrozumiałe dla zwykłego człowieka.
`
          },
          {
            role: "user",
            content: message
          }
        ],
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

  } catch (error) {
    return res.status(500).json({
      error: "Błąd serwera",
      details: error.message
    });
  }
}
