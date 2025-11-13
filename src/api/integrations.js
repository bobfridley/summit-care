// src/api/integrations.js
// Local dev stubs for “integrations” that the Base44 client used to provide.
// Replace these with real implementations as you add them.

export const Core = {
  async InvokeLLM({ prompt } = {}) {
    return { reply: `🤖 (dev) Echo: ${prompt ?? ""}` };
  },

  async SendEmail({ to, subject, html } = {}) {
    console.log("SendEmail (dev):", { to, subject, htmlLength: html?.length ?? 0 });
    return { ok: true, id: "dev-mail-001" };
  },

  async UploadFile(file) {
    console.log("UploadFile (dev):", { name: file?.name, size: file?.size });
    return { url: "/uploads/dev-file.txt" };
  },

  async GenerateImage({ prompt } = {}) {
    console.log("GenerateImage (dev):", { prompt });
    return { url: "/images/dev-placeholder.png" };
  },

  async ExtractDataFromUploadedFile({ url } = {}) {
    console.log("ExtractDataFromUploadedFile (dev):", { url });
    return { data: { ok: true, source: url ?? "dev" } };
  },

  async CreateFileSignedUrl({ filename } = {}) {
    return { url: `https://example.com/dev-signed/${filename ?? "file.bin"}` };
  },

  async UploadPrivateFile(file) {
    console.log("UploadPrivateFile (dev):", { name: file?.name, size: file?.size });
    return { ok: true, id: "dev-private-001" };
  },
};

// Named exports (for existing import sites):
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const CreateFileSignedUrl = Core.CreateFileSignedUrl;
export const UploadPrivateFile = Core.UploadPrivateFile;
