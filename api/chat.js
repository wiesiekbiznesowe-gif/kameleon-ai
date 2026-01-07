export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Brak historii rozmowy" });
    }

    const lastUserMessage =
      messages[messages.length - 1]?.content?.toLowerCase() || "";

    // 🔍 WYKRYWANIE PYTAŃ WYMAGAJĄCYCH INTERNETU
    const needsInternet =
      /(dziś|dzisiaj|teraz|aktualnie|leci|program|tv|tvp|polsat|kanal|na jakim kanale|o której|co grają|film dziś)/i.test(
        lastUserMessage
      );

    let internetContext = "";

    // 🌐 POBIERANIE DANYCH Z INTERNETU (Bing Search API)
    if (needsInternet) {
      const searchQuery = lastUserMessage;

      const searchResponse = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(
          searchQuery
        )}&recency=1&domains=tvp.pl,polsat.pl,programtv.onet.pl`,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY
          }
        }
      );

      const searchData = await searchResponse.json();

      if (searchData?.webPages?.value?.length) {
        internetContext = searchData.webPages.value
          .slice(0, 5)
          .map((r) => `- ${r.name}: ${r.snippet}`)
          .join("\n");
      }
    }

    const finalMessages = [
      {
        role: "system",
        content: `
Jesteś profesjonalnym, konkretnym asystentem AI.
- NIE pytasz użytkownika o doprecyzowanie, jeśli możesz odpowiedzieć.
- NIE moralizujesz.
- NIE gubisz kontekstu rozmowy.
- Odpowiadasz normalnie, po ludzku.
- Jeśli masz dane z internetu — używasz ich.
- Jeśli nie masz pewnych danych — mówisz to wprost.
- Kontynuujesz rozmowę logicznie, jak człowiek.
        `
      },
      ...(internetContext
        ? [
            {
              role: "system",
              content: `AKTUALNE DANE Z INTERNETU:\n${internetContext}`
            }
          ]
        : []),
      ...messages
    ];

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: finalMessages,
          temperature: 0.6
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
