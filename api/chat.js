export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Brak historii rozmowy" });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // 🔍 WYKRYWANIE PYTAŃ WYMAGAJĄCYCH INTERNETU
    const needsInternet =
      /dziś|dzisiaj|teraz|tv|tvp|polsat|kanal|leci|program|ramówka/i.test(
        lastUserMessage
      );

    let internetContext = "";

    // 🌐 POBIERANIE DANYCH Z INTERNETU (Bing Search API)
    if (needsInternet) {
      const searchResponse = await fetch(
        "https://api.bing.microsoft.com/v7.0/search?q=" +
          encodeURIComponent(lastUserMessage),
        {
          headers: {
            "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY
          }
        }
      );

      const searchData = await searchResponse.json();

      if (searchData.webPages?.value?.length) {
        internetContext = searchData.webPages.value
          .slice(0, 5)
          .map(
            (r) =>
              `• ${r.name}: ${r.snippet}`
          )
          .join("\n");
      }
    }

    const finalMessages = [
      {
        role: "system",
        content:
          "Jesteś profesjonalnym asystentem AI o nazwie Kameleon AI. " +
          "Rozmawiasz po polsku, naturalnie i konkretnie. " +
          "Pamiętasz kontekst całej rozmowy. " +
          "Zaimki typu „go”, „to”, „ten” odnoszą się do ostatniego omawianego obiektu. " +
          "Jeśli dostępne są dane z internetu – korzystasz z nich. " +
          "Nie moralizujesz i nie wspominasz o regulaminach."
      },
      ...messages
    ];

    if (internetContext) {
      finalMessages.push({
        role: "system",
        content: `AKTUALNE DANE Z INTERNETU:\n${internetContext}`
      });
    }

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
          temperature: 0.4
        })
      }
    );

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
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
