import { z } from "zod";

// Mensagens padrão de validação em português do Brasil (as próprias do NewBras já são).
z.config(z.locales.ptBR());

/** Identificador em minúsculas, com letras, números e hífens (ex.: "bra-flamengo"). */
export const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use letras minúsculas, números e hífens (ex.: bra-santos)");

/** Código FIFA de três letras (ex.: BRA, ENG, KSA). */
export const CodigoPais = z.string().regex(/^[A-Z]{3}$/, "código FIFA de 3 letras maiúsculas");

/** Cor em hexadecimal (#RRGGBB). */
export const Cor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "cor no formato #RRGGBB");

/** Data completa (AAAA-MM-DD). */
export const Data = z.iso.date();

/** Dia do ano sem o ano (MM-DD), para datas que se repetem todo ano. */
export const DiaDoAno = z
  .string()
  .regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, "dia do ano no formato MM-DD");

/** Período que se repete todo ano. Se `fim` vier antes de `inicio`, o período vira o ano. */
export const Periodo = z.object({
  inicio: DiaDoAno,
  fim: DiaDoAno,
});

export const NomeTexto = z.string().trim().min(1, "não pode ficar vazio").max(80);

export type Id = z.infer<typeof Id>;
export type CodigoPais = z.infer<typeof CodigoPais>;
export type Periodo = z.infer<typeof Periodo>;
