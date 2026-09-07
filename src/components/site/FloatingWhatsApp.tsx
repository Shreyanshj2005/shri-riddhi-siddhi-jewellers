import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { chromeQuery } from "@/lib/catalog.functions";
import { DEFAULT_CONTACT, getSetting, type ContactSettings } from "@/lib/types";
import { whatsappLink } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

export function FloatingWhatsApp() {
  const { data } = useQuery(chromeQuery);
  const contact = getSetting<ContactSettings>(data?.settings, "contact", DEFAULT_CONTACT);
  return (
    <a
      href={whatsappLink(contact.whatsapp, `Hello ${SITE_NAME}, I would like to enquire about your jewellery.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-success text-primary-foreground shadow-luxe transition-transform hover:scale-105"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
