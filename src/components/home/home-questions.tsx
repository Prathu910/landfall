import type { ReactNode } from "react";
import Link from "next/link";

const questions: [string, ReactNode][] = [
  [
    "Is it free?",
    "Your points and your three visa stamps are free, with no email or account. The full personal report is a one-off purchase, free for founding readers while places last, with a 7-day no-questions refund.",
  ],
  [
    "What do the labels mean?",
    "189 labels compare your points with your occupation’s recent listed cut-offs and higher-scoring EOIs. State labels summarise published invitation evidence at your nominated points. They are historical comparisons; your full report checks points-test basics and state rules separately.",
  ],
  [
    "Are the counts people?",
    "No, they count EOIs. One person can lodge several, and ties are broken by a date SkillSelect doesn’t publish. Masked counts stay ranges and may include zero.",
  ],
  [
    "Does state nomination add points?",
    "Yes: 5 for a 190 nomination and 15 for a 491 nomination. Each state also has its own rules, which your report checks separately. The 491 is a provisional regional pathway.",
  ],
  [
    "Where do my answers go?",
    <>
      The free check runs in your browser and sends us nothing. When you claim
      or buy the full report, your answers and email go to our server to build
      it, and we don’t subscribe you to marketing. Our{" "}
      <Link href="/privacy/">privacy policy</Link> says how long we keep them.
    </>,
  ],
];
export function HomeQuestions() {
  return (
    <section className="band paper" id="faq" aria-labelledby="faq-h">
      <div className="wrap">
        <h2 className="sec-h" id="faq-h">
          Questions
        </h2>
        <div className="faq">
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
