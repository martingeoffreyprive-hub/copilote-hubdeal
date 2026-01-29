/**
 * OpenAI Realtime API WebSocket client.
 * Connects via server proxy to protect API key.
 */
export interface RealtimeConfig {
  model: string;
  voice: string;
  language: string;
  onMessage: (event: RealtimeEvent) => void;
  onError: (error: Event) => void;
  onClose: () => void;
}

export interface RealtimeEvent {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;

  async connect(config: RealtimeConfig): Promise<void> {
    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/openai`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.send({
        type: "session.update",
        session: {
          model: config.model,
          voice: config.voice,
          instructions: `Tu es un assistant copilote pour artisans belges. Tu aides à créer des devis. Réponds en ${config.language === "fr" ? "français" : config.language === "nl" ? "néerlandais" : config.language === "de" ? "allemand" : "anglais"}.`,
          tools: getCopilotTools(),
        },
      });
    };

    this.ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data);
        config.onMessage(event);
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onerror = config.onError;
    this.ws.onclose = config.onClose;
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

function getCopilotTools() {
  return [
    {
      type: "function",
      name: "addRow",
      description: "Ajouter une ligne au devis",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string" },
          designation: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          unitPrice: { type: "number" },
          tvaRate: { type: "number" },
        },
        required: ["designation", "quantity", "unitPrice"],
      },
    },
    {
      type: "function",
      name: "updateRow",
      description: "Modifier une ligne existante du devis",
      parameters: {
        type: "object",
        properties: {
          rowId: { type: "string" },
          field: { type: "string" },
          value: { type: "string" },
        },
        required: ["rowId", "field", "value"],
      },
    },
    {
      type: "function",
      name: "deleteRow",
      description: "Supprimer une ligne du devis",
      parameters: {
        type: "object",
        properties: { rowId: { type: "string" } },
        required: ["rowId"],
      },
    },
  ];
}
