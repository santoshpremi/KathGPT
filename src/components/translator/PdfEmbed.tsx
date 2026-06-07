type PdfEmbedProps = {
  url: string;
  title: string;
};

/** PDF preview — embed works more reliably than iframe in Tauri webviews. */
export function PdfEmbed({ url, title }: PdfEmbedProps) {
  return (
    <object
      data={url}
      type="application/pdf"
      title={title}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 320,
        border: "none",
        display: "block",
        background: "#ffffff",
      }}
    >
      <embed
        src={url}
        type="application/pdf"
        title={title}
        style={{ width: "100%", height: "100%", minHeight: 320 }}
      />
    </object>
  );
}
