import { describe, it, expect } from "vitest";
import { isSafeWebhookUrl } from "./webhook-url.js";

describe("isSafeWebhookUrl (SSRF guard)", () => {
  it("accepts a normal public https URL", () => {
    expect(isSafeWebhookUrl("https://hooks.example.com/escalations")).toBe(true);
    expect(isSafeWebhookUrl("https://8.8.8.8/hook")).toBe(true); // public IP, not private
  });

  it("rejects non-https schemes", () => {
    expect(isSafeWebhookUrl("http://hooks.example.com/x")).toBe(false);
    expect(isSafeWebhookUrl("file:///etc/passwd")).toBe(false);
    expect(isSafeWebhookUrl("ftp://example.com/x")).toBe(false);
  });

  it("rejects malformed or empty input", () => {
    expect(isSafeWebhookUrl("not a url")).toBe(false);
    expect(isSafeWebhookUrl("")).toBe(false);
  });

  it("blocks the cloud-metadata SSRF target", () => {
    expect(isSafeWebhookUrl("https://169.254.169.254/latest/meta-data/")).toBe(false);
  });

  it("blocks loopback and localhost", () => {
    expect(isSafeWebhookUrl("https://localhost/x")).toBe(false);
    expect(isSafeWebhookUrl("https://app.localhost/x")).toBe(false);
    expect(isSafeWebhookUrl("https://127.0.0.1/x")).toBe(false);
    expect(isSafeWebhookUrl("https://[::1]/x")).toBe(false);
  });

  it("blocks RFC 1918 private ranges", () => {
    for (const url of [
      "https://10.0.0.5/x",
      "https://192.168.1.1/x",
      "https://172.16.0.1/x",
      "https://172.31.255.255/x",
    ]) {
      expect(isSafeWebhookUrl(url)).toBe(false);
    }
  });

  it("does not over-block public IPs adjacent to private ranges", () => {
    expect(isSafeWebhookUrl("https://172.15.0.1/x")).toBe(true);
    expect(isSafeWebhookUrl("https://172.32.0.1/x")).toBe(true);
  });
});
