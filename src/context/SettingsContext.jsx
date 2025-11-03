import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore'; 
import Loading from '../components/ui/Loading/Loading';

const SETTINGS_DOC_ID = 'siteSettings';
const SETTINGS_COLLECTION = 'config';

// --- VALORES PADRÃO ATUALIZADOS ---
const defaultSettings = {
    storeName: "Fina Estampa",
    logoUrl: "/logo.svg",
    promoBar: { text: "Carregando...", isEnabled: true },
    heroSlider: [],
    homeBanners: {},
    footerInfo: { cnpj: "00.000.000/0001-00", address: "Endereço Padrão...", whatsapp: "000000000", email: "contato@finaestampa.com" },
    socialMedia: {},
    dynamicPages: [],
    
    // --- REGRAS DE FRETE ATUALIZADAS ---
    shippingRules: {
        freeThreshold: 200.00, 
        defaultCost: 30.00,    
        stateCosts: [
            { uf: "PE", cost: 10.00 },
            { uf: "SP", cost: 25.00 },
            { uf: "RJ", cost: 28.00 },
        ],
        // --- NOVO: Frete por Bairro ---
        localCity: "Vitória de Santo Antão", // A cidade para o frete local
        localNeighborhoods: [
            { name: "Matriz", cost: 5.00 },
            { name: "Livramento", cost: 7.00 },
        ]
    }
    // --- FIM DA ATUALIZAÇÃO ---
};
// --- FIM DOS VALORES PADRÃO ---

const SettingsContext = createContext(defaultSettings);
export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(defaultSettings);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [loadingPages, setLoadingPages] = useState(true);

    // Efeito 1: Ouve as Configurações Principais
    useEffect(() => {
        const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const unsubscribeConfig = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                // Mescla os dados do Firestore com os padrões
                setSettings(prevDefaults => ({
                    ...prevDefaults,
                    ...docSnap.data(),
                    // Garante que os objetos aninhados também sejam mesclados
                    shippingRules: {
                        ...prevDefaults.shippingRules,
                        ...docSnap.data().shippingRules
                    }
                }));
            } else {
                console.warn("Documento de configurações não encontrado. Usando padrões.");
                setSettings(defaultSettings);
            }
            setLoadingConfig(false);
        }, (error) => {
            console.error("Erro ao buscar configurações:", error);
            setSettings(defaultSettings);
            setLoadingConfig(false);
        });
        return () => unsubscribeConfig();
    }, []);

    // Efeito 2: Ouve as Páginas Dinâmicas
    useEffect(() => {
        const pagesRef = collection(db, 'pages');
        const q = query(pagesRef, where('showInMenu', '==', true));
        const unsubscribePages = onSnapshot(q, (querySnapshot) => {
            const dynamicPages = [];
            querySnapshot.forEach(doc => {
                dynamicPages.push({ slug: doc.id, title: doc.data().title });
            });
            setSettings(prev => ({ ...prev, dynamicPages: dynamicPages }));
            setLoadingPages(false);
        }, (error) => {
            console.error("Erro ao buscar páginas dinâmicas:", error);
            setLoadingPages(false);
        });
        return () => unsubscribePages();
    }, []);

    if (loadingConfig || loadingPages) {
        return <Loading />; 
    }

    return (
        <SettingsContext.Provider value={{ settings }}>
            {children}
        </SettingsContext.Provider>
    );
};