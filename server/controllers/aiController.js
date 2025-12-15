const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CORREÇÃO: Usando o nome exato que apareceu na sua lista ("gemini-flash-latest")
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

exports.handleIncomingMessage = async (req, res) => {
    try {
        const { from, body } = req.body; 
        if (!body) return res.sendStatus(200);
        
        console.log(`Recebido de ${from}: ${body}`);
        
        const responseText = await processWithGemini(body);
        
        console.log(`Gemini Respondeu: ${responseText}`);
        res.status(200).json({ reply: responseText, original_user: from });

    } catch (error) {
        console.error("Erro AI:", error);
        res.status(500).send(`Erro IA: ${error.message}`);
    }
};

async function processWithGemini(userMessage) {
    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: "Aja como Vox2You. Responda curto." }],
            },
            {
                role: "model",
                parts: [{ text: "Ok." }],
            },
        ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    return response.text();
}
