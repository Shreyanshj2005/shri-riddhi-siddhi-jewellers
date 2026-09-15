import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Why is hallmark necessary on jewellery?",
    answer:
      "Hallmarking provides an independent assurance of the purity and fineness of precious-metal jewellery. It helps customers verify the quality of the gold or silver they are purchasing.",
  },
  {
    question:
      "What is IGI certification, and why is it important for diamond jewellery?",
    answer:
      "IGI certification is an independent diamond grading report that provides details about a diamond’s characteristics, including the 4Cs — Cut, Color, Clarity and Carat Weight. It helps customers make an informed decision when purchasing diamond jewellery.",
  },
  {
    question: "What is HUID?",
    answer:
      "HUID stands for Hallmark Unique Identification. It is a unique six-digit alphanumeric identification number assigned to a hallmarked gold jewellery item. Customers can use the HUID to verify hallmark details through the BIS CARE app.",
  },
  {
    question: "Why is a GST bill important when purchasing jewellery?",
    answer:
      "A GST invoice provides an official record of your jewellery purchase, including the seller’s GSTIN, invoice details, product value and applicable taxes. It is useful for maintaining purchase records and for eligible tax-related requirements.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Frequently Asked Questions
          </p>

          <h2 className="font-display text-3xl text-foreground md:text-4xl">
            Know Before You Buy
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Everything you need to know about jewellery purity,
            certification and your purchase.
          </p>
        </div>

        {/* FAQ List */}
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/40 md:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-foreground md:text-base">
                    {faq.question}
                  </span>

                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 md:px-6">
                    <p className="text-sm leading-7 text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}