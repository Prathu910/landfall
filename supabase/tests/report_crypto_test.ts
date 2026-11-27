import {
  decryptToken,
  encryptToken,
  newToken,
  sha256Hex,
  sixDigitCode,
} from "../functions/_shared/report/crypto.ts";
import { equal, TOKEN_KEY } from "./report_fake.ts";

async function rejects(run: () => Promise<unknown>): Promise<Error> {
  try {
    await run();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected a rejection");
}

const TOKEN = "Q".repeat(42) + "w";

Deno.test("sha256Hex matches the published SHA-256 vector", async () => {
  equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

Deno.test(
  "newToken gives 32 random bytes as base64url and its hash",
  async () => {
    const bytes = new Uint8Array(32).fill(255);
    const { token, hash } = await newToken(() => bytes);
    equal(token, "_".repeat(42) + "8");
    equal(hash, await sha256Hex(token));
  },
);

Deno.test("sixDigitCode is always six digits and skips biased draws", () => {
  const draws = [
    [0xff, 0xff, 0xff, 0xff], // 4294967295: above the last full million, redrawn
    [0x00, 0x00, 0x00, 0x2a], // 42
  ];
  equal(
    sixDigitCode(() => new Uint8Array(draws.shift()!)),
    "000042",
  );
  const codes = new Set<string>();
  for (let i = 0; i < 50; i++)
    codes.add(sixDigitCode((n) => crypto.getRandomValues(new Uint8Array(n))));
  equal(
    [...codes].every((code) => /^\d{6}$/.test(code)),
    true,
  );
});

Deno.test(
  "a token round-trips through AES-GCM with a fresh IV each time",
  async () => {
    const one = await encryptToken(TOKEN, TOKEN_KEY);
    const two = await encryptToken(TOKEN, TOKEN_KEY);
    equal(one === two, false);
    equal(/^[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/.test(one), true);
    equal(one.includes(TOKEN), false);
    equal(await decryptToken(one, TOKEN_KEY), TOKEN);
    equal(await decryptToken(two, TOKEN_KEY), TOKEN);
  },
);

Deno.test(
  "a wrong key, a tampered ciphertext or a bad key is refused without detail",
  async () => {
    const sealed = await encryptToken(TOKEN, TOKEN_KEY);
    const otherKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)));
    const [iv, body] = sealed.split(".");
    const tampered = `${iv}.${body[0] === "A" ? "B" : "A"}${body.slice(1)}`;
    for (const run of [
      () => decryptToken(sealed, otherKey),
      () => decryptToken(tampered, TOKEN_KEY),
      () => decryptToken("not-a-ciphertext", TOKEN_KEY),
      () => encryptToken(TOKEN, btoa("short")),
      () => encryptToken(TOKEN, ""),
    ]) {
      const error = await rejects(run);
      equal(String(error.message).includes(TOKEN), false);
      equal(String(error.message).includes(TOKEN_KEY), false);
    }
  },
);
