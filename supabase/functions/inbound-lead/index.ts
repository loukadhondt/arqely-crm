// Arqely CRM — inbound lead webhook
// POST /functions/v1/inbound-lead?source=framer|calcom|email&token=<webhook_secret>
// Creates/updates contact + company, opens a deal in the first pipeline stage,
// logs an activity and creates a follow-up task.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
    },
  });

type Lead = {
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  website?: string;
  city?: string;
  message?: string;
  subject?: string;
  meeting_at?: string;
  meeting_url?: string;
  activity_type: "form" | "booking" | "email";
  raw: Record<string, unknown>;
};

const pick = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const k of keys) {
    const found = Object.keys(obj).find((x) => x.toLowerCase().replace(/[\s_-]/g, "") === k.toLowerCase().replace(/[\s_-]/g, ""));
    if (found && obj[found] != null && String(obj[found]).trim() !== "") return String(obj[found]).trim();
  }
  return undefined;
};

const splitName = (name?: string) => {
  if (!name) return {};
  const parts = name.trim().split(/\s+/);
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") || undefined };
};

function parseFramer(body: Record<string, unknown>): Lead {
  const data = (body.data ?? body.fields ?? body) as Record<string, unknown>;
  const fullName = pick(data, ["name", "fullname", "nom", "full name"]);
  const first = pick(data, ["firstname", "first_name", "prénom", "prenom"]);
  const last = pick(data, ["lastname", "last_name", "nom de famille"]);
  const sn = splitName(fullName);
  return {
    email: pick(data, ["email", "e-mail", "mail"]),
    phone: pick(data, ["phone", "telephone", "téléphone", "tel", "phone number", "mobile"]),
    first_name: first ?? sn.first_name,
    last_name: last ?? sn.last_name,
    company: pick(data, ["company", "business", "entreprise", "société", "societe", "business name", "company name"]),
    website: pick(data, ["website", "site", "url", "site web"]),
    city: pick(data, ["city", "ville", "location"]),
    message: pick(data, ["message", "details", "description", "besoin", "comment", "notes"]),
    subject: "Formulaire site web",
    activity_type: "form",
    raw: body,
  };
}

function parseCalcom(body: Record<string, unknown>): Lead {
  const payload = (body.payload ?? body) as Record<string, unknown>;
  const attendees = (payload.attendees as Record<string, unknown>[] | undefined) ?? [];
  const a = attendees[0] ?? {};
  const responses = (payload.responses as Record<string, { value?: unknown }> | undefined) ?? {};
  const rv = (k: string) => {
    const v = responses[k]?.value;
    return v == null ? undefined : String(v);
  };
  const sn = splitName((a.name as string) ?? rv("name"));
  const meta = (payload.metadata as Record<string, unknown> | undefined) ?? {};
  return {
    email: (a.email as string) ?? rv("email"),
    phone: rv("phone") ?? rv("attendeePhoneNumber") ?? (a.phoneNumber as string | undefined),
    first_name: sn.first_name,
    last_name: sn.last_name,
    company: rv("company") ?? rv("business"),
    message: rv("notes") ?? (payload.additionalNotes as string | undefined),
    subject: `Audit gratuit réservé — ${(payload.title as string) ?? "cal.com"}`,
    meeting_at: payload.startTime as string | undefined,
    meeting_url: (meta.videoCallUrl as string | undefined) ?? (payload.location as string | undefined),
    activity_type: "booking",
    raw: body,
  };
}

function parseEmail(body: Record<string, unknown>): Lead {
  const fromRaw = pick(body, ["from", "from_email", "sender", "fromemail"]) ?? "";
  const m = fromRaw.match(/^(?:"?([^"<]*)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?$/);
  const name = pick(body, ["from_name", "fromname", "sender_name"]) ?? m?.[1]?.trim();
  const sn = splitName(name);
  return {
    email: (m?.[2] ?? fromRaw).toLowerCase() || undefined,
    first_name: sn.first_name,
    last_name: sn.last_name,
    subject: pick(body, ["subject", "objet"]) ?? "Email entrant",
    message: pick(body, ["text", "body", "body_plain", "snippet", "html", "message"]),
    activity_type: "email",
    raw: body,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = new URL(req.url);
  const source = (url.searchParams.get("source") ?? "framer").toLowerCase();
  const token = url.searchParams.get("token") ?? req.headers.get("x-webhook-token") ?? "";

  const { data: secretRow } = await supabase.from("app_settings").select("value").eq("key", "webhook_secret").single();
  if (!secretRow || token !== secretRow.value) return json({ error: "invalid token" }, 401);

  let body: Record<string, unknown> = {};
  const ct = req.headers.get("content-type") ?? "";
  try {
    if (ct.includes("application/json")) body = await req.json();
    else if (ct.includes("form")) body = Object.fromEntries((await req.formData()).entries()) as Record<string, unknown>;
    else body = JSON.parse(await req.text() || "{}");
  } catch {
    return json({ error: "unreadable body" }, 400);
  }

  // cal.com ping / non-booking events
  if (source === "calcom") {
    const ev = String(body.triggerEvent ?? "");
    if (ev && !["BOOKING_CREATED", "BOOKING_RESCHEDULED"].includes(ev)) return json({ ignored: ev });
  }

  const { data: eventRow } = await supabase.from("inbound_events").insert({ source, payload: body }).select("id").single();
  const eventId = eventRow?.id;

  try {
    const lead = source === "calcom" ? parseCalcom(body) : source === "email" ? parseEmail(body) : parseFramer(body);
    if (!lead.email && !lead.phone) throw new Error("no email or phone in payload");

    // default owner
    const { data: ownerSetting } = await supabase.from("app_settings").select("value").eq("key", "default_owner_email").single();
    let ownerId: string | null = null;
    if (ownerSetting?.value) {
      const { data: owner } = await supabase.from("profiles").select("id").ilike("email", ownerSetting.value).maybeSingle();
      ownerId = owner?.id ?? null;
    }

    // company
    let companyId: string | null = null;
    if (lead.company) {
      const { data: existing } = await supabase.from("companies").select("id").ilike("name", lead.company).maybeSingle();
      if (existing) companyId = existing.id;
      else {
        const { data: c } = await supabase.from("companies")
          .insert({ name: lead.company, website: lead.website, city: lead.city, owner_id: ownerId }).select("id").single();
        companyId = c?.id ?? null;
      }
    }

    // contact (match by email, then phone)
    let contact: { id: string; company_id: string | null } | null = null;
    if (lead.email) {
      const { data } = await supabase.from("contacts").select("id, company_id").ilike("email", lead.email).maybeSingle();
      contact = data;
    }
    if (!contact && lead.phone) {
      const { data } = await supabase.from("contacts").select("id, company_id").eq("phone", lead.phone).maybeSingle();
      contact = data;
    }
    let isNew = false;
    if (!contact) {
      isNew = true;
      const { data, error } = await supabase.from("contacts").insert({
        first_name: lead.first_name, last_name: lead.last_name, email: lead.email, phone: lead.phone,
        company_id: companyId, source, status: "lead", owner_id: ownerId,
        tags: source === "calcom" ? ["audit"] : [],
      }).select("id, company_id").single();
      if (error) throw error;
      contact = data;
    } else {
      const patch: Record<string, unknown> = {};
      if (!contact.company_id && companyId) patch.company_id = companyId;
      if (lead.phone) patch.phone = lead.phone;
      if (Object.keys(patch).length) await supabase.from("contacts").update(patch).eq("id", contact.id);
      if (!companyId) companyId = contact.company_id;
    }

    // deal: reuse open deal or create in first stage
    let dealId: string | null = null;
    const { data: openDeal } = await supabase.from("deals").select("id, stage_id").eq("contact_id", contact.id).eq("status", "open").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: stages } = await supabase.from("pipeline_stages").select("id, position, name_en, name_fr").order("position");
    const firstStage = stages?.[0];
    const auditStage = stages?.find((s) => ["meeting","audit","rendez"].some((k) => s.name_en.toLowerCase().includes(k) || s.name_fr.toLowerCase().includes(k)));
    if (openDeal) {
      dealId = openDeal.id;
      if (source === "calcom" && auditStage) {
        const cur = stages?.find((s) => s.id === openDeal.stage_id);
        if (cur && cur.position < auditStage.position) await supabase.from("deals").update({ stage_id: auditStage.id }).eq("id", dealId);
      }
    } else if (firstStage) {
      const stageId = source === "calcom" && auditStage ? auditStage.id : firstStage.id;
      const title = lead.company ?? [lead.first_name, lead.last_name].filter(Boolean).join(" ") ?? lead.email ?? "Lead";
      const { data: d } = await supabase.from("deals").insert({
        title, contact_id: contact.id, company_id: companyId, stage_id: stageId, owner_id: ownerId,
      }).select("id").single();
      dealId = d?.id ?? null;
    }

    // activity
    const bodyText = [lead.message, lead.meeting_at ? `RDV: ${new Date(lead.meeting_at).toLocaleString("fr-BE", { timeZone: "Europe/Brussels", dateStyle: "full", timeStyle: "short" })}` : null, lead.meeting_url ? `Lien: ${lead.meeting_url}` : null].filter(Boolean).join("\n\n");
    await supabase.from("activities").insert({
      type: lead.activity_type, subject: lead.subject, body: bodyText || null,
      contact_id: contact.id, company_id: companyId, deal_id: dealId,
      occurred_at: new Date().toISOString(), metadata: { source, event_id: eventId },
    });

    // task
    const due = new Date();
    if (source === "calcom" && lead.meeting_at) due.setTime(new Date(lead.meeting_at).getTime());
    else due.setHours(due.getHours() + 24);
    await supabase.from("tasks").insert({
      title: source === "calcom" ? "Préparer l'audit gratuit / Prepare free audit" : source === "email" ? "Répondre à l'email / Reply to email" : "Rappeler le lead / Call back the lead",
      description: lead.message?.slice(0, 500) ?? null,
      due_at: due.toISOString(), priority: source === "calcom" ? "high" : "normal",
      assignee_id: ownerId, contact_id: contact.id, company_id: companyId, deal_id: dealId,
    });

    await supabase.from("inbound_events").update({ processed: true, contact_id: contact.id }).eq("id", eventId);
    return json({ ok: true, contact_id: contact.id, deal_id: dealId, new_contact: isNew });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("inbound_events").update({ error: msg }).eq("id", eventId);
    return json({ error: msg }, 422);
  }
});
