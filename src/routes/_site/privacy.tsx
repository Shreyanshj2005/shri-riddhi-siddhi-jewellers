import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_site/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Shri Riddhi Siddhi Jewellers" },
      { name: "description", content: "Privacy Policy for the Shri Riddhi Siddhi Jewellers website, Sultanpur." },
      { property: "og:title", content: "Privacy Policy | Shri Riddhi Siddhi Jewellers" },
      { property: "og:description", content: "Privacy Policy for the Shri Riddhi Siddhi Jewellers website." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="container-luxe max-w-3xl py-16 lg:py-24">
      <p className="eyebrow">Legal</p>
      <h1 className="gold-rule mt-3 font-serif text-4xl sm:text-5xl">Privacy Policy</h1>
      <div className="mt-10 space-y-6 text-[0.95rem] leading-relaxed text-muted-foreground">
        <p>Shri Riddhi Siddhi Jewellers, Badi Durga Maa Sthal, Chowk, Thatheri Bazaar, Khairabad, Sultanpur, Uttar Pradesh 228001.</p>
        <p>This website is a catalogue of jewellery available at our showroom. Prices shown are indicative and are confirmed at the showroom based on the prevailing gold and diamond rates on the day of purchase. Enquiries made through WhatsApp, phone or the contact form are used only to respond to you and are never sold to third parties.</p>
        <p>Your wishlist is stored only on your device. We do not require an account to browse this website.</p>
        <p>For any questions, call 096530 69612.</p>
      </div>
    </div>
  );
}
