import { unzipSync } from "npm:fflate@0.8.2";
import { Bank, bankDate, BankError, Json, object } from "./sicoob.ts";

export type Report = { request: number; day: string };

export async function requestSettlementReport(bank: Bank): Promise<Report> {
  const wallet = bank.config.wallet;
  if (!wallet) throw new BankError(503);
  const today = new Date();
  const day = bankDate(today);
  const data = object((await bank.json("boleto", "/boletos/movimentacoes", "POST", {
    numeroCliente: wallet.number,
    tipoMovimento: 5,
    dataInicial: bankDate(new Date(today.getTime() - 86_400_000)),
    dataFinal: day,
  }))?.resultado);
  if (!Number.isSafeInteger(data.codigoSolicitacao) || Number(data.codigoSolicitacao) < 1) throw new BankError(502);
  return { request: Number(data.codigoSolicitacao), day };
}

export function decodeReport(encoded: unknown): Json[] {
  if (typeof encoded !== "string" || encoded.length > 2_800_000 || !encoded.startsWith("UEsD")) {
    throw new BankError(502);
  }
  const zip = Uint8Array.from(atob(encoded), value => value.charCodeAt(0));
  let size = 0;
  let entries = 0;
  const files = unzipSync(zip, { filter(file) {
    size += file.originalSize;
    entries += 1;
    if (size > 4_000_000 || entries > 20) throw new BankError(502);
    return file.name.endsWith(".json");
  } });
  return Object.values(files).flatMap(bytes => {
    const records = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!Array.isArray(records)) throw new BankError(502);
    return records.map(object);
  });
}

export async function readSettlementReport(bank: Bank, report: Report): Promise<Json[] | null> {
  const wallet = bank.config.wallet;
  if (!wallet || !Number.isSafeInteger(report.request) || report.request < 1) throw new BankError(502);
  const params = new URLSearchParams({ numeroCliente: String(wallet.number), codigoSolicitacao: String(report.request) });
  const response = await bank.json("boleto", `/boletos/movimentacoes?${params}`);
  if (!response) return null;
  const files = object(response.resultado).idArquivos;
  if (!Array.isArray(files) || files.length > 12 || files.some(id => !Number.isSafeInteger(id) || id < 1)) {
    throw new BankError(502);
  }
  const records: Json[] = [];
  for (const id of files) {
    params.set("idArquivo", String(id));
    const file = object((await bank.json("boleto", `/boletos/movimentacoes/download?${params}`))?.resultado);
    records.push(...decodeReport(file.arquivo));
  }
  return records;
}
