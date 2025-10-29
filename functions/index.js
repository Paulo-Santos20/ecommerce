const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Função Agendada (Cron Job) que roda todo dia.
 * Busca por produtos cuja 'offerEndDate' já passou e os desativa.
 */
exports.deactivateExpiredOffers = functions
  .region("southamerica-east1") // Use a região do seu banco!
  .pubsub.schedule("every 24 hours")
  .onRun(async (context) => {
    
    const now = admin.firestore.Timestamp.now();
    
    // 1. Busca no Firestore por produtos em promoção que expiraram
    const query = db.collection("products")
      .where("onSale", "==", true) // Está em promoção
      .where("offerEndDate", "!=", null) // Tem uma data de término
      .where("offerEndDate", "<=", now); // A data já passou
      
    const expiredProducts = await query.get();
    
    if (expiredProducts.empty) {
      console.log("Nenhuma oferta expirada encontrada.");
      return null;
    }

    // 2. Usa um WriteBatch para atualizar todos de uma vez (Performance)
    const batch = db.batch();
    
    expiredProducts.forEach(doc => {
      console.log(`Desativando oferta do produto: ${doc.id}`);
      
      // REQUISITO: Volta ao valor normal
      // Desativa a promoção e limpa a data de término
      batch.update(doc.ref, {
        onSale: false,
        offerEndDate: null
        // (O front-end já sabe não mostrar o 'oldPrice' se 'onSale' for false)
      });
    });

    // 3. Executa a atualização
    await batch.commit();
    console.log(`Sucesso! ${expiredProducts.size} ofertas foram desativadas.`);
    return null;
  });