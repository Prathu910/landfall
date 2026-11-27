import { Check, LockKeyhole, Mail } from "lucide-react";
import type { ReceiptView } from "@/lib/checkout/receipt-view";
import type { Currency } from "@/lib/orders/contract";
import { NOT_ADVICE, SELLER_LINE } from "@/lib/orders/seller";
import type { ReactNode } from "react";
import styles from "./receipt.module.css";

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "INR", label: "₹ INR" },
  { value: "USD", label: "$ USD" },
];

function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

function Lines({
  view,
  currency,
  canSwitch,
  onCurrency,
}: {
  view: Extract<ReceiptView, { kind: "quoted" }>;
  currency: Currency;
  canSwitch: boolean;
  onCurrency: (currency: Currency) => void;
}) {
  const { item, discount, seats } = view;
  return (
    <>
      {view.usdSwitch && (
        <div className={styles.currency} role="group" aria-label="Currency">
          {CURRENCIES.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={currency === option.value}
              disabled={!canSwitch}
              onClick={() => onCurrency(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      <div className={styles.line}>
        <div>
          {item.title}
          <small>{item.detail}</small>
        </div>
        <b className={styles.num}>{item.price}</b>
      </div>
      {discount && (
        <div className={`${styles.line} ${styles.discount}`}>
          <div>
            {discount.title}
            <small>{discount.detail}</small>
          </div>
          <b className={styles.num}>{discount.amount}</b>
        </div>
      )}
      <div className={styles.tear} aria-hidden="true" />
      <div className={styles.total}>
        <span>Total today</span>
        <span className={`${styles.amount} ${styles.num}`}>{view.total}</span>
      </div>
      {seats && (
        <div className={styles.seats}>
          <span>
            <b>{seats.remaining}</b> of {seats.limit} left
          </span>
          <span className={styles.meter} aria-hidden="true">
            <i style={{ width: `${seats.taken * 100}%` }} />
          </span>
        </div>
      )}
    </>
  );
}

function Trust({ lines }: { lines: string[] }) {
  return (
    <ul className={styles.trust}>
      {lines.map((line) => {
        const Icon = line.startsWith("Secure")
          ? LockKeyhole
          : line.startsWith("Questions")
            ? Mail
            : Check;
        return (
          <li key={line}>
            <Icon size={15} aria-hidden />
            {line}
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  view: ReceiptView;
  currency: Currency;
  canSwitch: boolean;
  onCurrency: (currency: Currency) => void;
  /** The email row, consent, verification and ticket, or an outcome. */
  children: ReactNode;
};

/** The order summary (paid-report-3.html: .receipt, .tear, .meter, .trust). */
export function Receipt({
  view,
  currency,
  canSwitch,
  onCurrency,
  children,
}: Props) {
  return (
    <aside className={styles.receipt} aria-label="Order summary">
      <div className={styles.head}>
        <span className={styles.k}>ORDER SUMMARY</span>
        <span className={styles.no}>MigrateLens</span>
      </div>
      <div className={styles.body}>
        {view.kind === "pending" ? (
          <Skeleton />
        ) : (
          <Lines
            view={view}
            currency={currency}
            canSwitch={canSwitch}
            onCurrency={onCurrency}
          />
        )}
        {children}
        {view.kind === "quoted" && <Trust lines={view.trust} />}
        <p className={styles.fine}>{NOT_ADVICE}</p>
        <p className={styles.fine}>{SELLER_LINE}</p>
      </div>
    </aside>
  );
}
