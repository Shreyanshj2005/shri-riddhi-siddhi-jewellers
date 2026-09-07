import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { chromeQuery, submitEnquiry } from "@/lib/catalog.functions";
import { ShowroomBlock } from "@/components/site/ShowroomBlock";
import { SectionHeading } from "@/components/site/Sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CONTACT, getSetting, type ContactSettings, type MapSettings } from "@/lib/types";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Showroom | Shri Riddhi Siddhi Jewellers, Sultanpur" },
      { name: "description", content: "Visit Shri Riddhi Siddhi Jewellers at Badi Durga Maa Sthal, Thatheri Bazaar, Khairabad, Sultanpur. Call 096530 69612 or message us on WhatsApp." },
      { property: "og:title", content: "Contact & Showroom | Shri Riddhi Siddhi Jewellers" },
      { property: "og:description", content: "Visit our showroom in Thatheri Bazaar, Sultanpur. Call 096530 69612 or WhatsApp us." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(data?.settings, "contact", DEFAULT_CONTACT);
  const map = getSetting<MapSettings>(data?.settings, "map", { query: `${contact.address_line1}, ${contact.address_line2}`, embed_url: "" });
  const [form, setForm] = useState({ customer_name: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await submitEnquiry({ data: form });
      setDone(true);
      toast.success("Thank you — we will call you back shortly.");
    } catch {
      toast.error("Could not send. Please call or WhatsApp us.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="bg-ink text-ink-foreground">
        <div className="container-luxe py-20 lg:py-28">
          <p className="eyebrow">Get In Touch</p>
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-6xl">Visit Our Showroom</h1>
          <p className="mt-4 max-w-lg text-ink-muted">We would love to welcome you. Walk in, call, or send us a message and we will get back to you.</p>
        </div>
      </section>
      <section className="container-luxe py-16 lg:py-24">
        <ShowroomBlock contact={contact} map={map} />
      </section>
      <section className="container-luxe pb-20 lg:pb-28">
        <div className="mx-auto max-w-xl">
          <SectionHeading eyebrow="Request A Call Back" title="Send Us A Message" />
          {done ? (
            <p className="text-center font-serif text-2xl">Thank you. Our team will contact you soon.</p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input required placeholder="Your name" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="h-12 rounded-none" />
              <Input required type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-none" />
              <Textarea placeholder="What are you looking for? (e.g. diamond solitaire ring under ₹1 lakh)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="min-h-32 rounded-none" />
              <Button type="submit" variant="luxe" size="xl" disabled={busy}>{busy ? "Sending…" : "Send Message"}</Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
