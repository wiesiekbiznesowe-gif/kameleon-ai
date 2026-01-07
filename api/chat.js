let conversationHistory = [
  {
    role: "system",
    content:
      "Jesteś inteligentnym, pomocnym asystentem AI. Rozmawiasz naturalnie po polsku. Pamiętasz kontekst rozmowy i nie gubisz tematu. Odpowiadasz konkretnie, bez lania wody. Jeśli użytkownik pisze potocznie lub z błędami – rozumiesz sens i odpowiadasz normalnie. Nie moralizujesz, nie oceniasz, nie pouczasz."
  }
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Brak wiadomości" });
    }

    // Dodaj wiadomość użytkownika do historii
    conversationHistory.push({
      role: "user",
      content: message
    });

    // Ograniczenie historii (żeby nie rosła w nieskończoność)
    if (conversationHistory.length > 20) {
      conversationHistory = [
        conversationHistory[0], // system
        ...conversationHistory.slice(-18)
      ];
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: conversationHistory,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "Brak odpowiedzi AI" });
    }

    const aiReply = data.choices[0].message.content;

    // Dodaj odpowiedź AI do historii
    conversationHistory.push({
      role: "assistant",
      content: aiReply
    });

    return res.status(200).json({
      reply: aiReply
    });

  } catch (error) {
    return res.status(500).json({
      error: "Błąd serwera",
      details: error.message
    });
  }
}
