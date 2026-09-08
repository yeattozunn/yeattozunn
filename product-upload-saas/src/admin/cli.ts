import 'dotenv/config';
import * as readline from 'readline';
import { listPendingPayments, confirmPayment } from '../db/repositories';
import { pool } from '../db/pool';

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

async function main() {
  const pending = await listPendingPayments();

  if (pending.length === 0) {
    console.log('Bekleyen ödeme yok.');
    await pool.end();
    return;
  }

  console.log(`${pending.length} bekleyen ödeme bulundu:\n`);
  pending.forEach((p, i) => {
    console.log(`[${i + 1}] ${p.customerName} — kod: ${p.paymentReferenceCode} (plan: ${p.plan})`);
  });

  const answer = await ask('\nOnaylamak istediğiniz numarayı girin (boş bırakıp Enter = çıkış): ');
  if (!answer) {
    await pool.end();
    return;
  }

  const index = Number(answer) - 1;
  const selected = pending[index];
  if (!selected) {
    console.error('Geçersiz numara.');
    await pool.end();
    process.exitCode = 1;
    return;
  }

  await confirmPayment(selected.customerId);
  console.log(`Onaylandı: ${selected.customerName}. Abonelik 1 ay uzatıldı, bot aktif.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exitCode = 1;
});
