import {
  cssColourToHex,
  razorpayOptions,
  type RazorpayOpen,
  type RazorpayOptions,
} from "../../lib/checkout/razorpay-options";

export type RazorpayCtor = new (options: RazorpayOptions) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
const TIMEOUT_MS = 15000;
let loading: Promise<RazorpayCtor> | undefined;

/** Loads Checkout once, on the pay press only; rejects after 15 s. */
export function loadRazorpay(): Promise<RazorpayCtor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error("unavailable"));
    };
    const timer = window.setTimeout(fail, TIMEOUT_MS);
    script.onload = () => {
      clearTimeout(timer);
      if (window.Razorpay) resolve(window.Razorpay);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}

/** The brand green as the page shows it now (tokens are light-dark pairs). */
function brandGreen(): string | null {
  const probe = document.createElement("span");
  probe.style.color = "var(--brand-green)";
  probe.hidden = true;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return cssColourToHex(colour);
}

export function openRazorpay(ctor: RazorpayCtor, opts: RazorpayOpen): void {
  new ctor(razorpayOptions(opts, brandGreen())).open();
}
