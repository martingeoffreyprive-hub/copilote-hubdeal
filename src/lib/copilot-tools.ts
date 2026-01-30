/**
 * OpenAI function calling tool definitions for quote manipulation.
 */
export const QUOTE_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "add_row",
      description: "Ajouter une nouvelle ligne au devis. Utilise cette fonction quand l'utilisateur demande d'ajouter un poste, un matériau, une prestation, etc.",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string", description: "Titre ou ID de la section cible (ex: 'Démolition', 'Carrelage'). Si non spécifié, utilise la dernière section créée." },
          designation: { type: "string", description: "Nom/description du poste (ex: 'Carrelage sol 60x60')" },
          description: { type: "string", description: "Description détaillée optionnelle" },
          quantity: { type: "number", description: "Quantité (ex: 25)" },
          unit: { type: "string", enum: ["m²", "m³", "ml", "pce", "h", "forfait", "kg", "l", "jour"], description: "Unité de mesure" },
          unitPrice: { type: "number", description: "Prix unitaire HTVA en euros (ex: 45.00)" },
          tvaRate: { type: "number", enum: [0, 6, 12, 21], description: "Taux de TVA. 6% pour rénovation habitation >10 ans, 21% standard, 0% si exonéré" },
        },
        required: ["designation", "quantity", "unit", "unitPrice", "tvaRate"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_row",
      description: "Modifier une ligne existante du devis. Utilise cette fonction quand l'utilisateur veut changer le prix, la quantité, la désignation, etc. d'une ligne existante. Tu peux identifier la ligne par son index OU par sa désignation.",
      parameters: {
        type: "object",
        properties: {
          rowIndex: { type: "number", description: "Numéro de la ligne (commence à 0). Optionnel si rowDesignation est fourni." },
          rowDesignation: { type: "string", description: "Nom/désignation de la ligne à modifier (correspondance partielle, ex: 'carrelage sol'). Utilisé si rowIndex non fourni." },
          designation: { type: "string", description: "Nouvelle désignation" },
          quantity: { type: "number", description: "Nouvelle quantité" },
          unit: { type: "string", enum: ["m²", "m³", "ml", "pce", "h", "forfait", "kg", "l", "jour"] },
          unitPrice: { type: "number", description: "Nouveau prix unitaire HTVA" },
          tvaRate: { type: "number", enum: [0, 6, 12, 21], description: "Nouveau taux TVA" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "delete_row",
      description: "Supprimer une ligne du devis. Tu peux identifier la ligne par son index OU par sa désignation.",
      parameters: {
        type: "object",
        properties: {
          rowIndex: { type: "number", description: "Numéro de la ligne à supprimer (commence à 0). Optionnel si rowDesignation est fourni." },
          rowDesignation: { type: "string", description: "Nom/désignation de la ligne à supprimer (correspondance partielle)." },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_section",
      description: "Ajouter une nouvelle section au devis (ex: 'Démolition', 'Plomberie', 'Électricité').",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titre de la section" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "set_client_info",
      description: "Définir les informations du client sur le devis.",
      parameters: {
        type: "object",
        properties: {
          clientName: { type: "string", description: "Nom du client" },
          clientAddress: { type: "string", description: "Adresse du client" },
          clientEmail: { type: "string", description: "Email du client" },
          clientPhone: { type: "string", description: "Téléphone du client" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "set_discount",
      description: "Appliquer une remise globale sur le devis.",
      parameters: {
        type: "object",
        properties: {
          value: { type: "number", description: "Valeur de la remise" },
          type: { type: "string", enum: ["percent", "fixed"], description: "Type: pourcentage ou montant fixe en EUR" },
        },
        required: ["value", "type"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "set_notes",
      description: "Ajouter ou modifier les notes/conditions générales du devis.",
      parameters: {
        type: "object",
        properties: {
          notes: { type: "string", description: "Texte des notes ou conditions (ex: 'Validité 30 jours. Acompte 30% à la commande.')" },
        },
        required: ["notes"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "set_project_description",
      description: "Définir la description du projet/chantier.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Description du projet (ex: 'Rénovation salle de bain complète')" },
        },
        required: ["description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "undo",
      description: "Annuler la dernière action sur le devis. Utilise quand l'utilisateur dit 'annule', 'reviens en arrière', 'undo'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "redo",
      description: "Rétablir la dernière action annulée. Utilise quand l'utilisateur dit 'rétablis', 'redo', 'remets'.",
      parameters: { type: "object", properties: {} },
    },
  },
];
