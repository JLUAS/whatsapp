const { OpenAI } = require("openai");
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL_ID;

const openai = new OpenAI({ apiKey });

/**
 * Genera una respuesta usando OpenAI.
 * @param {string} userMessage - El mensaje enviado por el usuario.
 * @param {string} systemContent - Mensaje del sistema para definir el contexto.
 * @returns {Promise<string>} - La respuesta generada por OpenAI.
 */
async function getOpenAIResponse(userMessage, systemContent) {
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemContent },
                { role: "user", content: userMessage },
            ],
        });

        return response.choices?.[0]?.message?.content || null;
    } catch (error) {
        console.error("Error al consultar la API de OpenAI:", error);
        throw new Error("Hubo un problema al procesar tu solicitud.");
    }
}

module.exports = { getOpenAIResponse };