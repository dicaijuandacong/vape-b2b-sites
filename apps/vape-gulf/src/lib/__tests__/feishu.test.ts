import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTenantAccessToken,
  readFeishuConfig,
  toWhatsAppUrl,
  mapLeadToFields,
  appendLead,
  buildNewLeadCard,
  notifyNewLead,
  _resetTokenCacheForTest,
} from "../feishu";

const ENV = {
  FEISHU_APP_ID: "cli_test",
  FEISHU_APP_SECRET: "secret_test",
  FEISHU_BITABLE_APP_TOKEN: "BASExxx",
  FEISHU_LEADS_TABLE_ID: "tblYYY",
  FEISHU_BOT_WEBHOOK: "https://open.feishu.cn/open-apis/bot/v2/hook/abc",
};

beforeEach(() => {
  vi.resetModules();
  _resetTokenCacheForTest();
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
});

afterEach(() => {
  for (const k of Object.keys(ENV)) delete process.env[k];
  vi.restoreAllMocks();
});

describe("readFeishuConfig", () => {
  it("reads config from env", () => {
    const cfg = readFeishuConfig();
    expect(cfg.appId).toBe("cli_test");
    expect(cfg.bitableAppToken).toBe("BASExxx");
    expect(cfg.botWebhook).toContain("/hook/abc");
  });

  it("throws when required env missing", () => {
    delete process.env.FEISHU_APP_SECRET;
    expect(() => readFeishuConfig()).toThrow(/env missing/);
  });
});

describe("getTenantAccessToken", () => {
  it("fetches and caches token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ code: 0, tenant_access_token: "t-abc", expire: 7200 }),
        { status: 200 },
      ),
    );
    const t1 = await getTenantAccessToken();
    const t2 = await getTenantAccessToken();
    expect(t1).toBe("t-abc");
    expect(t2).toBe("t-abc");
    expect(fetchMock).toHaveBeenCalledTimes(1); // cached
  });

  it("throws on non-zero code", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: 99991, msg: "bad secret" }), { status: 200 }),
    );
    await expect(getTenantAccessToken()).rejects.toThrow(/bad secret/);
  });
});

describe("toWhatsAppUrl", () => {
  it("strips non-digits and builds wa.me url", () => {
    expect(toWhatsAppUrl("+971 (50) 123-4567", "")).toBe("https://wa.me/971501234567");
  });
  it("handles 00 international prefix", () => {
    expect(toWhatsAppUrl("0031612345678", "")).toBe("https://wa.me/31612345678");
  });
  it("appends encoded text", () => {
    expect(toWhatsAppUrl("31612345678", "Hi there")).toBe(
      "https://wa.me/31612345678?text=Hi%20there",
    );
  });
  it("returns null for empty/invalid", () => {
    expect(toWhatsAppUrl(undefined, "")).toBeNull();
    expect(toWhatsAppUrl("no digits", "")).toBeNull();
  });
});

describe("mapLeadToFields", () => {
  it("maps a wholesale lead to bitable fields", () => {
    const f = mapLeadToFields({
      siteKey: "europe",
      type: "wholesale",
      email: "a@b.com",
      company: "Acme",
      country: "NL",
      phone: "+31 6 12345678",
      brands: ["Elfbar"],
      volume: "1000",
      notes: "hi",
      ip: "1.2.3.4",
      ua: "ua",
    });
    expect(f["来源站"]).toBe("europe");
    expect(f["状态"]).toBe("新询盘");
    expect(f["WhatsApp"]).toEqual({
      text: expect.stringContaining("wa.me/316"),
      link: expect.any(String),
    });
    expect(f["意向品牌"]).toEqual(["Elfbar"]);
  });

  it("omits optional empty fields for newsletter", () => {
    const f = mapLeadToFields({ siteKey: "dubai", type: "newsletter", email: "x@y.com" });
    expect(f["公司"]).toBeUndefined();
    expect(f["WhatsApp"]).toBeUndefined();
    expect(f["邮箱"]).toBe("x@y.com");
  });
});

describe("appendLead", () => {
  it("posts to bitable with bearer token and returns record_id", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/tenant_access_token/internal")) {
        return new Response(
          JSON.stringify({ code: 0, tenant_access_token: "t-1", expire: 7200 }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({ code: 0, data: { record: { record_id: "rec123" } } }),
        { status: 200 },
      );
    });
    const id = await appendLead({ siteKey: "europe", type: "wholesale", email: "a@b.com" });
    expect(id).toBe("rec123");
    const calls = vi.mocked(globalThis.fetch).mock.calls;
    const recordCall = calls.find((c) => String(c[0]).includes("/records"))!;
    expect((recordCall[1]?.headers as Record<string, string>)["Authorization"]).toBe("Bearer t-1");
  });

  it("throws on non-zero code", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/tenant_access_token/internal")) {
        return new Response(
          JSON.stringify({ code: 0, tenant_access_token: "t-1", expire: 7200 }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ code: 1254291, msg: "concurrent write" }), {
        status: 200,
      });
    });
    await expect(
      appendLead({ siteKey: "europe", type: "wholesale", email: "a@b.com" }),
    ).rejects.toThrow(/concurrent write/);
  });
});

describe("buildNewLeadCard", () => {
  it("builds a card with WhatsApp + email buttons for wholesale", () => {
    const card = buildNewLeadCard(
      {
        siteKey: "dubai",
        type: "wholesale",
        email: "a@b.com",
        company: "Acme",
        phone: "+971501234567",
      },
      "rec1",
    ) as { header: { title: { content: string }; template: string }; elements: unknown[] };
    expect(card.header.title.content).toContain("DubaiVape");
    expect(card.header.template).toBe("green");
    const action = card.elements[1] as { actions: Array<{ url: string; type: string }> };
    const urls = action.actions.map((a) => a.url);
    expect(urls.some((u) => u.startsWith("https://wa.me/971"))).toBe(true);
    // email is percent-encoded (defense-in-depth vs hostile form input)
    expect(urls.some((u) => u.startsWith("mailto:a%40b.com"))).toBe(true);
  });

  it("omits WhatsApp button when no phone (newsletter)", () => {
    const card = buildNewLeadCard(
      { siteKey: "europe", type: "newsletter", email: "x@y.com" },
      "rec2",
    ) as { elements: Array<{ actions?: Array<{ url: string }> }> };
    const action = card.elements[1];
    const urls = action.actions!.map((a) => a.url);
    expect(urls.every((u) => !u.startsWith("https://wa.me/"))).toBe(true);
  });

  it("escapes lark_md metacharacters in untrusted form fields", () => {
    const card = buildNewLeadCard(
      { siteKey: "europe", type: "wholesale", email: "a@b.com", company: "Acme *evil* `co`", notes: "x_y~" },
      "rec3",
    ) as { elements: Array<{ text?: { content: string } }> };
    const content = card.elements[0].text!.content;
    expect(content).toContain("Acme \\*evil\\* \\`co\\`");
    expect(content).toContain("x\\_y\\~");
    expect(content).not.toContain("**Acme *evil***");
  });
});

describe("notifyNewLead", () => {
  it("posts interactive card to webhook", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: 0 }), { status: 200 }),
    );
    await notifyNewLead({ siteKey: "europe", type: "wholesale", email: "a@b.com" }, "rec1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/bot/v2/hook/abc");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.msg_type).toBe("interactive");
    expect(body.card.header.title.content).toContain("EuroVape");
  });

  it("no-ops when neither webhook nor chat configured", async () => {
    delete process.env.FEISHU_BOT_WEBHOOK;
    delete process.env.FEISHU_NOTIFY_CHAT_ID;
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await notifyNewLead({ siteKey: "europe", type: "wholesale", email: "a@b.com" }, "rec1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("prefers app-bot with status buttons when chat + recordId are set", async () => {
    process.env.FEISHU_BOT_WEBHOOK = "https://open.feishu.cn/open-apis/bot/v2/hook/abc";
    process.env.FEISHU_NOTIFY_CHAT_ID = "oc_test";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ code: 0, tenant_access_token: "t-1" }), { status: 200 }),
    );
    await notifyNewLead({ siteKey: "europe", type: "wholesale", email: "a@b.com" }, "rec9");
    const msgCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/im/v1/messages"));
    expect(msgCall).toBeTruthy();
    const posted = JSON.parse((msgCall![1] as RequestInit).body as string);
    const card = JSON.parse(posted.content);
    const statusActions = (card.elements as { tag: string; actions?: { value?: { op: string } }[] }[]).find(
      (el) => el.actions?.some((a) => a.value?.op),
    );
    expect(statusActions?.actions?.map((a) => a.value?.op)).toEqual([
      "followed_up",
      "won",
      "invalid",
    ]);
    delete process.env.FEISHU_NOTIFY_CHAT_ID;
  });
});
