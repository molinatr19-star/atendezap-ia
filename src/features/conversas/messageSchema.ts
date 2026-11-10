import { z } from "zod";

/** Limite de texto de uma mensagem na WhatsApp Cloud API. */
export const MAX_MESSAGE_LENGTH = 4096;

export const outgoingMessageSchema = z
  .string()
  .trim()
  .min(1, "Digite uma mensagem antes de enviar.")
  .max(MAX_MESSAGE_LENGTH, `A mensagem pode ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
