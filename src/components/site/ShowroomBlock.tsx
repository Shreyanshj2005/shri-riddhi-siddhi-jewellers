import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContactSettings, MapSettings } from "@/lib/types";
import { directionsLink, mapEmbedUrl, telLink, whatsappLink } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

export function ShowroomBlock({ contact, map, showMap = true }: { contact: ContactSettings; map: MapSettings; showMap?: boolean }) {
  const query = map.query || `${contact.address_line1}, ${contact.address_line2}`;
  const embed = map.embed_url || mapEmbedUrl(query);
  return (
    <div className="grid overflow-hidden border border-border lg:grid-cols-2">
      <div className="flex flex-col justify-center bg-card p-8 lg:p-14">
        <p className="eyebrow">Visit Us</p>
        <h3 className="mt-3 font-serif text-3xl lg:text-4xl">{contact.business_name}</h3>
        <address className="mt-6 not-italic text-sm leading-relaxed text-muted-foreground">
          <span className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span>{contact.address_line1}<br />{contact.address_line2}</span></span>
          <span className="mt-3 flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={telLink(contact.phone)} className="hover:text-foreground">{contact.phone}</a></span>
          <span className="mt-3 flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{contact.hours}</span>
        </address>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="luxe" size="lg"><a href={telLink(contact.phone)}><Phone /> Call</a></Button>
          <Button asChild variant="whatsapp" size="lg"><a href={whatsappLink(contact.whatsapp, `Hello ${SITE_NAME}, I would like to visit your showroom.`)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
          <Button asChild variant="outline-luxe" size="lg"><a href={directionsLink(query)} target="_blank" rel="noreferrer"><MapPin /> Get Directions</a></Button>
        </div>
      </div>
      {showMap && (
        <div className="min-h-[320px] bg-muted">
          <iframe title="Showroom location map" src={embed} className="h-full w-full min-h-[320px] grayscale-[30%]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      )}
    </div>
  );
}
