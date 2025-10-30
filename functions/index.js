const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// Importa o serverTimestamp v2
const { serverTimestamp } = admin.firestore.FieldValue;

// Define a região globalmente para todas as funções
setGlobalOptions({ region: "southamerica-east1" });

/**
 * FUNÇÃO 1: Desativa ofertas expiradas
 * Roda todo dia
 */
exports.deactivateExpiredOffers = onSchedule("every 24 hours", async (event) => {
  logger.log("Iniciando verificação de ofertas expiradas...");
  const now = admin.firestore.Timestamp.now();
  
  const query = db.collection("products")
    .where("onSale", "==", true)
    .where("offerEndDate", "!=", null)
    .where("offerEndDate", "<=", now);
    
  const expiredProducts = await query.get();
  
  if (expiredProducts.empty) {
    logger.log("Nenhuma oferta expirada encontrada.");
    return;
  }

  const batch = db.batch();
  expiredProducts.forEach((doc) => {
    logger.log(`Desativando oferta do produto: ${doc.id}`);
    batch.update(doc.ref, { onSale: false, offerEndDate: null });
  });

  await batch.commit();
  logger.log(`Sucesso! ${expiredProducts.size} ofertas foram desativadas.`);
  return;
});

/**
 * FUNÇÃO 2: Notifica o Admin no Telegram
 * Dispara quando um usuário cria uma nova mensagem
 */
exports.notifyAdminOnNewMessage = onDocumentCreated("conversations/{userId}/messages/{messageId}", async (event) => {
  
  const snap = event.data;
  if (!snap) {
    logger.log("Nenhum dado associado ao evento.");
    return;
  }
  const message = snap.data();
  
  // Só notifica se o autor for o USUÁRIO
  if (message.author !== "user") {
    logger.log("Mensagem do admin, não é necessário notificar.");
    return;
  }

  const userId = event.params.userId;
  const userName = message.authorName || "Usuário Desconhecido"; 
  
  // Formato de mensagem robusto com Ref:
  const text = `Nova mensagem de ${userName}:\n\n"${message.text}"\n\n---\nRef: ${userId}`;
  
  const BOT_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    logger.error("TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID não configurados no .env!");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    await axios.post(url, { chat_id: CHAT_ID, text: text });
    logger.log("Notificação do Telegram enviada com sucesso!");
  } catch (error) {
    logger.error("Erro ao enviar notificação do Telegram:", error.response?.data || error.message);
  }
  return;
});

/**
 * FUNÇÃO 3: Webhook do Telegram
 * Recebe respostas do admin e salva no Firestore
 */
exports.telegramWebhook = onRequest(async (req, res) => {
  // Verifica o token secreto
  const secretToken = req.header("X-Telegram-Bot-Api-Secret-Token");
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    logger.warn("Request não autorizado (token inválido)");
    return res.status(401).send("Unauthorized");
  }

  const { message } = req.body;

  // Ignora se não for uma resposta a uma mensagem
  if (!message || !message.reply_to_message || !message.text) {
    logger.log("Não é uma resposta ou não tem texto, ignorando.");
    return res.status(200).send("OK");
  }

  try {
    const adminReplyText = message.text;
    const originalMessage = message.reply_to_message.text;

    // Extrai o Ref: da última linha
    const lines = originalMessage.split('\n');
    const lastLine = lines[lines.length - 1]; 
    const match = lastLine.match(/Ref: ([\w-]+)/); 

    if (!match || !match[1]) {
      logger.error("Não foi possível encontrar o 'Ref: {userId}' na última linha da mensagem de resposta.", originalMessage);
      // Avisa o admin no Telegram sobre o erro
      await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: `ERRO: Não consegui identificar o usuário (Ref:) desta resposta. Por favor, use "Reply" na mensagem original do bot.`
      });
      return res.status(200).send("OK");
    }

    const userId = match[1];

    // Salva a resposta do admin no Firestore
    const messagesRef = db.collection("conversations").doc(userId).collection("messages");
    await messagesRef.add({
      text: adminReplyText,
      author: "admin", 
      authorName: "Fina Estampa",
      createdAt: serverTimestamp(), // Sintaxe v2 correta
    });

    // Atualiza a "última mensagem" na conversa
    const convoRef = db.collection("conversations").doc(userId);
    await convoRef.update({
        lastMessage: adminReplyText,
        lastUpdatedAt: serverTimestamp(), // Sintaxe v2 correta
        isReadByAdmin: true 
    });

    logger.log(`Resposta do admin salva para o usuário ${userId}`);
    return res.status(200).send("OK"); 

  } catch (error) {
    logger.error("Erro ao processar webhook do Telegram:", error);
    return res.status(500).send("Erro interno");
  }
});

/**
 * FUNÇÃO 4: Apagar Chats Antigos
 * Roda todo dia às 5 da manhã
 */
exports.deleteOldConversations = onSchedule("every day 05:00", async (event) => {
  logger.log("Iniciando limpeza de conversas antigas...");
  
  // 1. Calcula o timestamp de 24 horas atrás
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

  // 2. Encontra conversas atualizadas antes do corte
  const query = db.collection("conversations")
    .where("lastUpdatedAt", "<=", cutoffTimestamp);
    
  const oldConversations = await query.get();
  
  if (oldConversations.empty) {
    logger.log("Nenhuma conversa antiga para apagar.");
    return null;
  }

  logger.log(`Encontradas ${oldConversations.size} conversas para apagar...`);
  
  // 3. Deleta as subcoleções (recursivamente) e os documentos principais
  const deletePromises = [];
  oldConversations.forEach(doc => {
    // Adiciona a promessa de deletar a subcoleção 'messages'
    // recursiveDelete é a forma correta de apagar subcoleções
    deletePromises.push(db.recursiveDelete(doc.ref.collection("messages")));
    
    // Adiciona a promessa de deletar o documento principal 'conversation'
    deletePromises.push(doc.ref.delete());
  });

  try {
    // 4. Espera todas as exclusões terminarem
    await Promise.all(deletePromises);
    logger.log(`Sucesso! ${oldConversations.size} conversas antigas foram apagadas.`);
  } catch (error) {
    logger.error("Erro ao apagar conversas antigas:", error);
  }
  
  return null;
});