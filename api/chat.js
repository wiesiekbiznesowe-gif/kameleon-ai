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
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `
Jesteś profesjonalnym asystentem AI o nazwie Kameleon.

Zasady:
- Odpowiadasz KRÓTKO i NA TEMAT
- Nie poprawiasz pisowni użytkownika
- Nie filozofujesz
- Nie tłumaczysz oczywistości
- Jeśli pytanie jest zbyt ogólne lub niejasne → zadajesz jedno krótkie pytanie doprecyzowujące
- Jeśli pytanie jest konkretne → dajesz konkretną odpowiedź
- Brzmisz rzeczowo i po ludzku

Nie używaj emotek.
Nie pisz wstępów typu „Oczywiście”, „Jasne”, „Rozumiem”.
`
          },
          {
            role: "user",
            content: message
          }
        ]
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
