// --- Imports Globais ---
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

// Importa os 'FieldValues' necessários (Timestamp e Increment)
const { serverTimestamp, increment } = admin.firestore.FieldValue;

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
  if (!snap) { logger.log("Nenhum dado associado ao evento."); return; }
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
  const secretToken = req.header("X-Telegram-Bot-Api-Secret-Token");
  if (secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
    logger.warn("Request não autorizado (token inválido)");
    return res.status(401).send("Unauthorized");
  }

  const { message } = req.body;

  if (!message || !message.reply_to_message || !message.text) {
    logger.log("Não é uma resposta ou não tem texto, ignorando.");
    return res.status(200).send("OK");
  }

  try {
    const adminReplyText = message.text;
    const originalMessage = message.reply_to_message.text;

    const lines = originalMessage.split('\n');
    const lastLine = lines[lines.length - 1]; 
    const match = lastLine.match(/Ref: ([\w-]+)/); 

    if (!match || !match[1]) {
      logger.error("Não foi possível encontrar o 'Ref: {userId}' na mensagem de resposta.", originalMessage);
      await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: `ERRO: Não consegui identificar o usuário (Ref:) desta resposta.`
      });
      return res.status(200).send("OK");
    }

    const userId = match[1];

    const messagesRef = db.collection("conversations").doc(userId).collection("messages");
    await messagesRef.add({
      text: adminReplyText,
      author: "admin", 
      authorName: "Fina Estampa",
      createdAt: serverTimestamp(),
    });

    const convoRef = db.collection("conversations").doc(userId);
    await convoRef.update({
        lastMessage: adminReplyText,
        lastUpdatedAt: serverTimestamp(),
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
  
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);
  const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoff);

  const query = db.collection("conversations").where("lastUpdatedAt", "<=", cutoffTimestamp);
  const oldConversations = await query.get();
  
  if (oldConversations.empty) {
    logger.log("Nenhuma conversa antiga para apagar.");
    return;
  }

  logger.log(`Encontradas ${oldConversations.size} conversas para apagar...`);
  
  const deletePromises = [];
  oldConversations.forEach(doc => {
    deletePromises.push(db.recursiveDelete(doc.ref.collection("messages")));
    deletePromises.push(doc.ref.delete());
  });

  try {
    await Promise.all(deletePromises);
    logger.log(`Sucesso! ${oldConversations.size} conversas antigas foram apagadas.`);
  } catch (error) {
    logger.error("Erro ao apagar conversas antigas:", error);
  }
  
  return;
});

/**
 * FUNÇÃO 5: Atualiza Contagem de Vendas e Uso de Cupons
 * Dispara quando um NOVO PEDIDO é criado na coleção 'orders'.
 */
exports.updateSalesCount = onDocumentCreated("orders/{orderId}", async (event) => {
  logger.log("Novo pedido detectado, atualizando contagens...");
  
  const snap = event.data;
  if (!snap) {
    logger.log("Nenhum dado no evento do pedido.");
    return;
  }
  
  const orderData = snap.data();
  const items = orderData.itens;
  const appliedCoupon = orderData.appliedCoupon; // Pega o cupom usado

  const batch = db.batch();

  // 1. Atualiza contagem de vendas dos PRODUTOS
  if (items && items.length > 0) {
    items.forEach(item => {
      if (item.productId) {
        const productRef = db.collection("products").doc(item.productId);
        batch.update(productRef, {
          salesCount: increment(item.quantity) // Usa o 'increment'
        });
      }
    });
  }

  // --- CORREÇÃO: Atualiza contagem de uso do CUPOM ---
  // (O Checkout.jsx precisa salvar 'appliedCoupon.id' no pedido)
  if (appliedCoupon && appliedCoupon.id) { 
    const couponRef = db.collection("coupons").doc(appliedCoupon.id);
    batch.update(couponRef, {
        uses: increment(1) // Incrementa o contador 'uses'
    });
    logger.log(`Contagem de uso do cupom ${appliedCoupon.code} atualizada.`);
  }
  // ----------------------------------------------------

  try {
    await batch.commit();
    logger.log(`Contagens do pedido ${snap.id} atualizadas.`);
  } catch (error) {
    logger.error("Erro ao atualizar contagens: ", error);
  }
  return;
});

/**
 * FUNÇÃO 6: Criar Novo Usuário (Admin)
 * (v2 Syntax: onCall)
 */
exports.createNewUser = onCall({ region: "southamerica-east1" }, async (request) => {
  // 1. Verifica se o usuário que está chamando está autenticado
  if (!request.auth) {
    logger.error("Falha de permissão: Usuário não autenticado.");
    throw new HttpsError('unauthenticated', 'Você deve estar logado.');
  }

  // 2. Verifica as permissões (Claims OU Firestore Database)
  let isCallerAdmin = false;
  if (request.auth.token.role === 'admin') {
    isCallerAdmin = true;
  } else {
    try {
      const adminUserDoc = await db.collection('users').doc(request.auth.uid).get();
      // Verifica o 'role' antigo ou a nova permissão
      if (adminUserDoc.data()?.role === 'admin' || adminUserDoc.data()?.permissions?.can_manage_users) {
        isCallerAdmin = true;
      }
    } catch (e) {
      logger.error("Erro ao verificar permissão do admin no Firestore:", e);
    }
  }

  if (!isCallerAdmin) {
    logger.error(`Falha de permissão: Usuário ${request.auth.uid} não é admin.`);
    throw new HttpsError('permission-denied', 'Você deve ser um administrador para criar usuários.');
  }

  // 3. Pega os dados do formulário
  const { email, password, displayName, role, permissions } = request.data;
  if (!email || !password || !displayName || !role) {
    throw new HttpsError('invalid-argument', 'Dados incompletos.');
  }

  try {
    // 4. Cria o usuário no Firebase AUTHENTICATION
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
    });

    // 5. Define o 'role' nos CLAIMS (para o back-end)
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: role });

    // 6. Cria o documento correspondente no FIRESTORE (para o front-end)
    await db.collection('users').doc(userRecord.uid).set({
      displayName: displayName,
      email: email,
      role: role,
      permissions: permissions || {}, // Salva o objeto de permissões
      createdAt: serverTimestamp(),
      cpf: '', dataNascimento: '', telefone: '',
      endereco: {}, historicoPedidos: [],
    });

    logger.log(`Novo usuário criado por admin: ${email} (UID: ${userRecord.uid})`);
    return { success: true, uid: userRecord.uid };

  } catch (error) {
    logger.error("Erro ao criar novo usuário:", error.message);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Este e-mail já está em uso.');
    }
    throw new HttpsError('internal', 'Erro interno ao criar usuário.');
  }
});