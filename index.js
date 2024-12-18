const { Client, NoAuth, AuthStrategy } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { OpenAI } = require("openai");
const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const { getOpenAIResponse } = require("./openai");
const fs = require('fs'); // Para verificar si el archivo existe
const qrFilePath = './qr.png'; // Ruta del archivo QR

const client = new Client({
    authStrategy: new NoAuth()
});
dotenv.config()
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL_ID;
const openai = new OpenAI({ apiKey });

const app = express()
app.use(cors())
let qrGenerated = false; // Bandera para indicar si el QR fue generado

let qrImageUrl = ""

client.on('ready', async () => {
    console.log('Client is ready!');
    const number = "8662367673";
    const sanitized_number = number.toString().replace(/[- )(]/g, ""); // remove unnecessary chars from the number
    const final_number = `52${sanitized_number.substring(sanitized_number.length - 10)}`; // add 91 before the number here 91 is country code of India

    const number_details = await client.getNumberId(final_number); // get mobile number details
    const sendData = "hola"
    if (number_details) {
        const sendMessageData = await client.sendMessage(number_details._serialized, sendData); // send message
    } else {
        console.log(final_number, "Mobile number is not registered");
    }
});

// Generar QR y guardar como imagen
client.on('qr', (qr) => {
    qrcode.toFile(qrFilePath, qr, (err) => {
        if (err) {
            console.error('Error al guardar QR como archivo:', err);
        } else {
            qrGenerated = true;
            console.log('QR guardado como qr.png');
        }
    });
});


client.on('message_create', async (message) => {
    if (message.body.length >= 2 && message.body.toLowerCase().includes("bot")) {
        console.log(message.body);

        const systemContent =
            "Eres un asistente del banco Santander especializado en terminales de pago del banco Santander. " +
            "Tu objetivo final es vender estas mismas. Cualquier pregunta que no sea del tema o se hable de cualquier otra " +
            "empresa, redirígela de manera amable e intenta usar lenguaje natural, como si fueras de Monterrey, Nuevo León.";

        try {
            const botResponse = await getOpenAIResponse(message.body, systemContent);

            if (botResponse) {
                await client.sendMessage(message.from, botResponse);
            } else {
                console.error("No se generó una respuesta válida desde OpenAI.");
                await client.sendMessage(message.from, "No pude procesar tu mensaje, intenta de nuevo.");
            }
        } catch (error) {
            await client.sendMessage(message.from, "Lo siento, hubo un problema al procesar tu mensaje.");
        }
    }
});

app.get('/qr', (req, res) => {
    if (qrGenerated && fs.existsSync(qrFilePath)) {
        res.sendFile(qrFilePath, { root: __dirname }, (err) => {
            if (err) {
                console.error('Error al enviar el archivo QR:', err);
                res.status(500).send('Error al acceder al QR');
            }
        });
    } else {
        res.status(404).send('El QR aún no está disponible. Intenta nuevamente más tarde.');
    }
});

client.initialize();

app.listen(3000, () => {
    console.log("Servidor activo")
})